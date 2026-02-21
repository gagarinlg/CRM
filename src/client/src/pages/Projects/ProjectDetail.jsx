import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Tabs, Tab, Button, Typography, Grid, Card, CardContent,
  Chip, Alert, Stack, Avatar, LinearProgress, IconButton, Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import NotesList from '../../components/Notes/NotesList.jsx';
import FilesList from '../../components/Files/FilesList.jsx';
import EntityTags from '../../components/common/EntityTags.jsx';
import EntityPickerDialog from '../../components/common/EntityPickerDialog.jsx';
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
  const [contacts, setContacts] = useState([]);
  const [members, setMembers] = useState([]);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const loadContacts = useCallback(() =>
    api.get(`/projects/${id}/contacts`).then(r => setContacts(r.data.data || r.data || [])), [id]);

  const loadMembers = useCallback(() =>
    api.get(`/projects/${id}/members`).then(r => setMembers(r.data.data || r.data || [])), [id]);

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/projects/${id}/groups`),
    ]).then(([projRes, grpRes]) => {
      const p = projRes.data.data || projRes.data;
      setProject(p);
      setContacts(p.contacts || []);
      setMembers(p.members || []);
      const grpData = grpRes.data.data || grpRes.data;
      setGroups(Array.isArray(grpData) ? grpData : []);
    }).catch((err) => setError(err?.response?.status === 404 ? t('projects.notFound') : t('errors.fetchFailed')))
      .finally(() => setLoading(false));
  }, [id, t]);

  const handleAddContact = async (contact) => {
    setAddContactOpen(false);
    try {
      await api.post(`/projects/${id}/contacts`, { contact_id: contact.id });
      loadContacts();
    } catch { setError(t('errors.saveFailed')); }
  };

  const handleRemoveContact = async (contactId) => {
    try {
      await api.delete(`/projects/${id}/contacts/${contactId}`);
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch { setError(t('errors.saveFailed')); }
  };

  const handleAddMember = async (user) => {
    setAddMemberOpen(false);
    try {
      await api.post(`/projects/${id}/members`, { user_id: user.id });
      loadMembers();
    } catch { setError(t('errors.saveFailed')); }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setMembers(prev => prev.filter(m => m.id !== userId));
    } catch { setError(t('errors.saveFailed')); }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) return <Alert severity="error">{error || t('errors.notFound')}</Alert>;

  const progress = project.progress ?? 0;
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
        <Tab label={t('files.title', 'Files')} />
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
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{t('tags.title', 'Tags')}</Typography>
                  <EntityTags entityType="project" entityId={id} />
                </Box>
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
        <Box display="flex" justifyContent="flex-end" mb={1}>
          <Tooltip title={t('projects.addContact', 'Add Contact')}>
            <IconButton color="primary" onClick={() => setAddContactOpen(true)}><PersonAddIcon /></IconButton>
          </Tooltip>
        </Box>
        {contacts.length === 0 ? (
          <Typography color="text.secondary">{t('common.noResults')}</Typography>
        ) : contacts.map(c => (
          <Card key={c.id} sx={{ mb: 1 }}>
            <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center' }}>
              <Box flex={1} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/contacts/${c.id}`)}>
                <Typography variant="body1" fontWeight={500}>{c.first_name} {c.last_name}</Typography>
                <Typography variant="body2" color="text.secondary">{c.position || c.email}</Typography>
              </Box>
              <Tooltip title={t('projects.removeContact', 'Remove')}>
                <IconButton size="small" color="error" onClick={() => handleRemoveContact(c.id)}><DeleteIcon fontSize="small" /></IconButton>
              </Tooltip>
            </CardContent>
          </Card>
        ))}
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <Box display="flex" justifyContent="flex-end" mb={1}>
          <Tooltip title={t('projects.addMember', 'Add Member')}>
            <IconButton color="primary" onClick={() => setAddMemberOpen(true)}><GroupAddIcon /></IconButton>
          </Tooltip>
        </Box>
        {members.length === 0 ? (
          <Typography color="text.secondary">{t('common.noResults')}</Typography>
        ) : members.map(m => (
          <Card key={m.id} sx={{ mb: 1 }}>
            <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ width: 28, height: 28, fontSize: 12, mr: 1.5 }}>
                {m.first_name?.[0]}{m.last_name?.[0]}
              </Avatar>
              <Box flex={1}>
                <Typography variant="body2" fontWeight={500}>{m.first_name} {m.last_name}</Typography>
                <Typography variant="caption" color="text.secondary">{m.email}</Typography>
              </Box>
              {m.role && <Chip label={m.role} size="small" sx={{ mr: 1 }} />}
              <Tooltip title={t('projects.removeMember', 'Remove')}>
                <IconButton size="small" color="error" onClick={() => handleRemoveMember(m.id)}><DeleteIcon fontSize="small" /></IconButton>
              </Tooltip>
            </CardContent>
          </Card>
        ))}
      </TabPanel>

      <TabPanel value={tab} index={3}>
        <NotesList entityType="project" entityId={id} />
      </TabPanel>

      <TabPanel value={tab} index={4}>
        <FilesList entityType="project" entityId={id} />
      </TabPanel>

      {isRestricted && (
        <TabPanel value={tab} index={5}>
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

      {/* Add Contact dialog */}
      <EntityPickerDialog
        open={addContactOpen}
        onClose={() => setAddContactOpen(false)}
        onSelect={handleAddContact}
        title={t('projects.addContact', 'Add Contact')}
        fetchItems={search => api.get('/contacts', { params: { search, limit: 50 } }).then(r => (r.data.data || r.data.items || []))}
        getLabel={c => `${c.first_name} ${c.last_name}`}
        getSubLabel={c => c.email}
        getInitials={c => `${c.first_name?.[0] || ''}${c.last_name?.[0] || ''}`}
      />

      {/* Add Member dialog */}
      <EntityPickerDialog
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        onSelect={handleAddMember}
        title={t('projects.addMember', 'Add Member')}
        fetchItems={search => api.get('/users', { params: { search, limit: 50 } }).then(r => (r.data.data || r.data.items || []))}
        getLabel={u => `${u.first_name} ${u.last_name}`}
        getSubLabel={u => u.email}
        getInitials={u => `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`}
      />
    </Box>
  );
}
