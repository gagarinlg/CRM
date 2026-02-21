import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Tabs, Tab, Button, Typography, Grid, Card, CardContent,
  Chip, Alert, Stack, MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TransformIcon from '@mui/icons-material/Transform';
import LockIcon from '@mui/icons-material/Lock';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import NotesList from '../../components/Notes/NotesList.jsx';
import FilesList from '../../components/Files/FilesList.jsx';

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

const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const STAGE_COLORS = { new: 'primary', contacted: 'secondary', qualified: 'info', proposal: 'warning', negotiation: 'warning', won: 'success', lost: 'error' };

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [lead, setLead] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [movingStage, setMovingStage] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertDialog, setConvertDialog] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/leads/${id}`),
      api.get(`/leads/${id}/groups`),
    ])
      .then(([leadRes, grpRes]) => {
        setLead(leadRes.data.data || leadRes.data);
        const g = grpRes.data.data || grpRes.data;
        setGroups(Array.isArray(g) ? g : []);
      })
      .catch(() => setError(t('errors.fetchFailed')))
      .finally(() => setLoading(false));
  }, [id, t]);

  const handleStageChange = async (newStage) => {
    setMovingStage(true);
    try {
      await api.patch(`/leads/${id}/stage`, { stage: newStage });
      setLead(prev => ({ ...prev, stage: newStage }));
    } catch {
      setError(t('errors.saveFailed'));
    } finally {
      setMovingStage(false);
    }
  };

  const handleConvert = async () => {
    setConverting(true);
    setConvertDialog(false);
    try {
      const res = await api.post(`/leads/${id}/convert`);
      const projectId = (res.data.data || res.data).project_id;
      navigate(`/projects/${projectId}`);
    } catch (err) {
      setError(err.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setConverting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!lead) return <Alert severity="error">{error || t('errors.notFound')}</Alert>;

  const canConvert = !['won', 'lost'].includes(lead.status);
  const isRestricted = lead.visibility === 'restricted';

  return (
    <Box>
      <PageHeader
        title={
          <Stack direction="row" spacing={1} alignItems="center">
            {isRestricted && <LockIcon fontSize="small" color="warning" />}
            <span>{lead.title}</span>
          </Stack>
        }
        actions={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/leads')}>{t('common.back')}</Button>
            {canConvert && (
              <Button
                variant="outlined"
                color="success"
                startIcon={<TransformIcon />}
                onClick={() => setConvertDialog(true)}
                disabled={converting}
              >
                {t('leads.convertToProject', 'Convert to Project')}
              </Button>
            )}
            <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/leads/${id}/edit`)}>
              {t('common.edit')}
            </Button>
          </Stack>
        }
      />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tab label={t('common.info')} />
        <Tab label={t('notes.title')} />
        <Tab label={t('files.title', 'Files')} />
        {isRestricted && <Tab label={t('leads.groups', 'Access Groups')} />}
      </Tabs>

      <TabPanel value={tab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle2">{t('leads.details')}</Typography>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                      value={lead.stage || ''}
                      onChange={e => handleStageChange(e.target.value)}
                      disabled={movingStage}
                      renderValue={v => <Chip label={v} size="small" color={STAGE_COLORS[v] || 'default'} />}
                    >
                      {STAGES.map(s => (
                        <MenuItem key={s} value={s}>
                          <Chip label={s} size="small" color={STAGE_COLORS[s] || 'default'} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <InfoRow label={t('leads.value')} value={lead.value != null ? `€${Number(lead.value).toLocaleString()}` : null} />
                <InfoRow label={t('leads.probability')} value={lead.probability != null ? `${lead.probability}%` : null} />
                <InfoRow label={t('leads.source')} value={lead.source} />
                {isRestricted && (
                  <Box mt={1}>
                    <Chip icon={<LockIcon />} label={t('leads.visibilityRestricted', 'Restricted')} size="small" color="warning" variant="outlined" />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" mb={2}>{t('common.relatedTo')}</Typography>
                {lead.company_name && (
                  <Box mb={1}>
                    <Typography variant="caption" color="text.secondary">{t('leads.company')}</Typography>
                    <Typography
                      variant="body2"
                      sx={{ cursor: 'pointer', color: 'primary.main' }}
                      onClick={() => lead.company_id && navigate(`/companies/${lead.company_id}`)}
                    >
                      {lead.company_name}
                    </Typography>
                  </Box>
                )}
                {lead.contact_name && (
                  <Box mb={1}>
                    <Typography variant="caption" color="text.secondary">{t('leads.contact')}</Typography>
                    <Typography
                      variant="body2"
                      sx={{ cursor: 'pointer', color: 'primary.main' }}
                      onClick={() => lead.contact_id && navigate(`/contacts/${lead.contact_id}`)}
                    >
                      {lead.contact_name}
                    </Typography>
                  </Box>
                )}
                <InfoRow label={t('leads.assignedTo')} value={lead.assigned_to_name} />
                <InfoRow label={t('common.notes')} value={lead.notes} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <NotesList entityType="lead" entityId={id} />
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <FilesList entityType="lead" entityId={id} />
      </TabPanel>

      {isRestricted && (
        <TabPanel value={tab} index={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" mb={2}>{t('leads.groups', 'Access Groups')}</Typography>
              {groups.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('leads.noGroups', 'No groups assigned. All users with lead access can see this.')}
                </Typography>
              ) : (
                <List dense>
                  {groups.map(g => (
                    <ListItem key={g.id} disableGutters>
                      <ListItemText primary={g.name} secondary={g.description} />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      )}

      {/* Convert to Project confirmation dialog */}
      <Dialog open={convertDialog} onClose={() => setConvertDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('leads.convertToProject', 'Convert to Project')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('leads.convertConfirm', 'Convert this lead into a project? The lead will be marked as won.')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertDialog(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="success" onClick={handleConvert}>
            {t('leads.convertToProject', 'Convert')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

