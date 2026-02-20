import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Tabs, Tab, Button, Typography, Grid, Card, CardContent,
  Chip, Alert, Stack, Avatar, Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import NotesList from '../../components/Notes/NotesList.jsx';
import dayjs from 'dayjs';

function InfoRow({ label, value }) {
  if (!value) return null;
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

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [contact, setContact] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, projRes] = await Promise.allSettled([
          api.get(`/contacts/${id}`),
          api.get(`/contacts/${id}/projects`),
        ]);
        if (cRes.status === 'fulfilled') setContact(cRes.value.data.data || cRes.value.data);
        if (projRes.status === 'fulfilled') setProjects(projRes.value.data.data || projRes.value.data || []);
      } catch {
        setError(t('errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!contact) return <Alert severity="error">{error || t('errors.notFound')}</Alert>;

  const initials = `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase();

  return (
    <Box>
      <PageHeader
        title={`${contact.firstName} ${contact.lastName}`}
        subtitle={contact.jobTitle}
        actions={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/contacts')}>{t('common.back')}</Button>
            <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/contacts/${id}/edit`)}>
              {t('common.edit')}
            </Button>
          </Stack>
        }
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tab label={t('common.info')} />
        <Tab label={`${t('nav.projects')} (${projects.length})`} />
        <Tab label={t('notes.title')} />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 28 }}>
                  {initials}
                </Avatar>
                <Typography variant="h6">{contact.firstName} {contact.lastName}</Typography>
                {contact.jobTitle && <Typography variant="body2" color="text.secondary">{contact.jobTitle}</Typography>}
                {contact.companyName && (
                  <Chip
                    label={contact.companyName}
                    size="small"
                    sx={{ mt: 1, cursor: 'pointer' }}
                    onClick={() => contact.companyId && navigate(`/companies/${contact.companyId}`)}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" mb={2}>{t('contacts.details')}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label={t('contacts.email')} value={contact.email} />
                    <InfoRow label={t('contacts.phone')} value={contact.phone} />
                    <InfoRow label={t('contacts.mobile')} value={contact.mobile} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow label={t('contacts.address')} value={contact.address} />
                    <InfoRow label={t('contacts.city')} value={contact.city} />
                    <InfoRow label={t('contacts.country')} value={contact.country} />
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <InfoRow
                  label={t('contacts.lastContact')}
                  value={contact.lastContactDate ? dayjs(contact.lastContactDate).format('DD MMM YYYY') : null}
                />
                <InfoRow label={t('contacts.notes')} value={contact.notes} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        {projects.length === 0 ? (
          <Typography color="text.secondary">{t('common.noResults')}</Typography>
        ) : projects.map(p => (
          <Card key={p.id} sx={{ mb: 1, cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
            <CardContent sx={{ py: 1.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body1" fontWeight={500}>{p.name}</Typography>
                <Chip label={p.status} size="small" />
              </Box>
            </CardContent>
          </Card>
        ))}
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <NotesList entityType="contact" entityId={id} />
      </TabPanel>
    </Box>
  );
}
