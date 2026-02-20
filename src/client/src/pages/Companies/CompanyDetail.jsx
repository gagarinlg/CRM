import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Tabs, Tab, Button, Typography, Grid, Card, CardContent,
  Chip, Alert, Stack, Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import NotesList from '../../components/Notes/NotesList.jsx';

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

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [company, setCompany] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, contRes, projRes, leadRes] = await Promise.allSettled([
          api.get(`/companies/${id}`),
          api.get(`/companies/${id}/contacts`),
          api.get(`/companies/${id}/projects`),
          api.get(`/companies/${id}/leads`),
        ]);
        if (cRes.status === 'fulfilled') setCompany(cRes.value.data.data || cRes.value.data);
        if (contRes.status === 'fulfilled') setContacts(contRes.value.data.data || contRes.value.data || []);
        if (projRes.status === 'fulfilled') setProjects(projRes.value.data.data || projRes.value.data || []);
        if (leadRes.status === 'fulfilled') setLeads(leadRes.value.data.data || leadRes.value.data || []);
      } catch {
        setError(t('errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!company) return <Alert severity="error">{error || t('errors.notFound')}</Alert>;

  return (
    <Box>
      <PageHeader
        title={company.name}
        subtitle={company.industry}
        actions={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/companies')}>{t('common.back')}</Button>
            <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/companies/${id}/edit`)}>
              {t('common.edit')}
            </Button>
          </Stack>
        }
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tab label={t('common.info')} />
        <Tab label={`${t('nav.contacts')} (${contacts.length})`} />
        <Tab label={`${t('nav.projects')} (${projects.length})`} />
        <Tab label={`${t('nav.leads')} (${leads.length})`} />
        <Tab label={t('notes.title')} />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" mb={2}>{t('companies.details')}</Typography>
                <InfoRow label={t('companies.name')} value={company.name} />
                <InfoRow label={t('companies.industry')} value={company.industry} />
                <InfoRow label={t('companies.phone')} value={company.phone} />
                <InfoRow label={t('companies.email')} value={company.email} />
                <InfoRow label={t('companies.website')} value={company.website} />
                <InfoRow label={t('companies.address')} value={company.address} />
                <InfoRow label={t('companies.city')} value={company.city} />
                <InfoRow label={t('companies.postalCode')} value={company.postal_code} />
                <InfoRow label={t('companies.country')} value={company.country} />
                <InfoRow label={t('companies.vatNumber')} value={company.vat_number} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" mb={2}>{t('common.notes')}</Typography>
                <Typography variant="body2" color="text.secondary">{company.notes || t('common.noNotes')}</Typography>
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
              <Typography variant="body2" color="text.secondary">{c.position} • {c.email}</Typography>
            </CardContent>
          </Card>
        ))}
      </TabPanel>

      <TabPanel value={tab} index={2}>
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

      <TabPanel value={tab} index={3}>
        {leads.length === 0 ? (
          <Typography color="text.secondary">{t('common.noResults')}</Typography>
        ) : leads.map(l => (
          <Card key={l.id} sx={{ mb: 1, cursor: 'pointer' }} onClick={() => navigate(`/leads/${l.id}`)}>
            <CardContent sx={{ py: 1.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body1" fontWeight={500}>{l.title}</Typography>
                <Chip label={l.stage} size="small" />
              </Box>
            </CardContent>
          </Card>
        ))}
      </TabPanel>

      <TabPanel value={tab} index={4}>
        <NotesList entityType="company" entityId={id} />
      </TabPanel>
    </Box>
  );
}
