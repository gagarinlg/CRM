import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Tabs, Tab, Button, Typography, Grid, Card, CardContent,
  Chip, Alert, Stack, Avatar, LinearProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import NotesList from '../../components/Notes/NotesList.jsx';
import dayjs from 'dayjs';

function InfoRow({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <Box mb={1.5}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}

function TabPanel({ value, index, children }) {
  return value === index ? <Box pt={2}>{children}</Box> : null;
}

const STATUS_COLOR = { active: 'success', planning: 'info', completed: 'default', cancelled: 'error', on_hold: 'warning' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/projects/${id}/groups`),
    ]).then(([projRes, grpRes]) => {
      setProject(projRes.data.data || projRes.data);
      const grpData = grpRes.data.data || grpRes.data;
      setGroups(Array.isArray(grpData) ? grpData : []);
    }).catch(() => setError(t('errors.fetchFailed')))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) return <LoadingSpinner />;
  if (!project) return <Alert severity="error">{error || t('errors.notFound')}</Alert>;

  const progress = project.progress ?? 0;
  const contacts = project.contacts || [];
  const members = project.members || [];
  const isRestricted = project.visibility === 'restricted';

  return (
    <Box>
      <PageHeader
        title={project.name}
        subtitle={project.description}
        actions={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')}>{t('common.back')}</Button>
            <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/projects/${id}/edit`)}>
              {t('common.edit')}
            </Button>
          </Stack>
        }
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tab label={t('common.info')} />
        <Tab label={`${t('nav.contacts')} (${contacts.length})`} />
        <Tab label={`${t('projects.members')} (${members.length})`} />
        <Tab label={t('notes.title')} />
        {isRestricted && <Tab icon={<LockIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`${t('projects.groups')} (${groups.length})`} />}
      </Tabs>

      <TabPanel value={tab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" mb={2}>{t('projects.details')}</Typography>
                <Box display="flex" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
                  <Chip label={project.status} color={STATUS_COLOR[project.status] || 'default'} />
                  {isRestricted && (
                    <Chip icon={<LockIcon />} label={t('projects.visibilityRestricted')} size="small" color="warning" />
                  )}
                  <Typography variant="body2" color="text.secondary">{t('projects.progress')}: {progress}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={progress} sx={{ mb: 2, height: 6, borderRadius: 3 }} />
                <InfoRow label={t('projects.startDate')} value={project.start_date ? dayjs(project.start_date).format('DD MMM YYYY') : null} />
                <InfoRow label={t('projects.endDate')} value={project.end_date ? dayjs(project.end_date).format('DD MMM YYYY') : null} />
                <InfoRow label={t('projects.budget')} value={project.budget != null ? `€${Number(project.budget).toLocaleString()}` : null} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" mb={2}>{t('common.description')}</Typography>
                <Typography variant="body2" color="text.secondary">{project.description || t('common.noData')}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        {contacts.length === 0 ? (
          <Typography color="text.secondary">{t('common.noResults')}</Typography>
        ) : contacts.map(c => (
          <Card key={c.id} sx={{ mb: 1, cursor: 'pointer' }} onClick={() => navigate(`/contacts/${c.id}`)}>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="body1" fontWeight={500}>{c.first_name} {c.last_name}</Typography>
              <Typography variant="body2" color="text.secondary">{c.email}</Typography>
            </CardContent>
          </Card>
        ))}
      </TabPanel>

      <TabPanel value={tab} index={2}>
        {members.length === 0 ? (
          <Typography color="text.secondary">{t('common.noResults')}</Typography>
        ) : members.map(m => (
          <Card key={m.id} sx={{ mb: 1 }}>
            <CardContent sx={{ py: 1.5 }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                  {m.first_name?.[0]}{m.last_name?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={500}>{m.first_name} {m.last_name}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.email}</Typography>
                </Box>
                {m.role && <Chip label={m.role} size="small" sx={{ ml: 'auto' }} />}
              </Box>
            </CardContent>
          </Card>
        ))}
      </TabPanel>

      <TabPanel value={tab} index={3}>
        <NotesList entityType="project" entityId={id} />
      </TabPanel>

      {isRestricted && (
        <TabPanel value={tab} index={4}>
          {groups.length === 0 ? (
            <Typography color="text.secondary">{t('common.noResults')}</Typography>
          ) : groups.map(g => (
            <Card key={g.id} sx={{ mb: 1 }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="body2" fontWeight={500}>{g.name}</Typography>
                {g.description && <Typography variant="caption" color="text.secondary">{g.description}</Typography>}
              </CardContent>
            </Card>
          ))}
        </TabPanel>
      )}
    </Box>
  );
}
