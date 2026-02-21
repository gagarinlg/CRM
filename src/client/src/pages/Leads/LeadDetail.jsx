import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Tabs, Tab, Button, Typography, Grid, Card, CardContent,
  Chip, Alert, Stack, MenuItem, Select, FormControl,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, IconButton, Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TransformIcon from '@mui/icons-material/Transform';
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
import EntityPickerDialog from '../../components/common/EntityPickerDialog.jsx';

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
  const [contacts, setContacts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [movingStage, setMovingStage] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertDialog, setConvertDialog] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const loadContacts = useCallback(() =>
    api.get(`/leads/${id}/contacts`).then(r => setContacts(r.data.data || r.data || [])), [id]);

  const loadMembers = useCallback(() =>
    api.get(`/leads/${id}/members`).then(r => setMembers(r.data.data || r.data || [])), [id]);

  useEffect(() => {
    Promise.all([
      api.get(`/leads/${id}`),
      api.get(`/leads/${id}/groups`),
      api.get(`/leads/${id}/contacts`),
      api.get(`/leads/${id}/members`),
    ])
      .then(([leadRes, grpRes, ctRes, mbRes]) => {
        setLead(leadRes.data.data || leadRes.data);
        const g = grpRes.data.data || grpRes.data;
        setGroups(Array.isArray(g) ? g : []);
        setContacts(ctRes.data.data || ctRes.data || []);
        setMembers(mbRes.data.data || mbRes.data || []);
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

  const handleAddContact = async (contact) => {
    setAddContactOpen(false);
    try {
      await api.post(`/leads/${id}/contacts`, { contact_id: contact.id });
      loadContacts();
    } catch { setError(t('errors.saveFailed')); }
  };

  const handleRemoveContact = async (contactId) => {
    try {
      await api.delete(`/leads/${id}/contacts/${contactId}`);
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch { setError(t('errors.saveFailed')); }
  };

  const handleAddMember = async (user) => {
    setAddMemberOpen(false);
    try {
      await api.post(`/leads/${id}/members`, { user_id: user.id });
      loadMembers();
    } catch { setError(t('errors.saveFailed')); }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await api.delete(`/leads/${id}/members/${userId}`);
      setMembers(prev => prev.filter(m => m.id !== userId));
    } catch { setError(t('errors.saveFailed')); }
  };

  if (loading) return <LoadingSpinner />;
  if (!lead) return <Alert severity="error">{error || t('errors.notFound')}</Alert>;

  const canConvert = !['won', 'lost'].includes(lead.status);
  const isRestricted = lead.visibility === 'restricted';

  // Tabs: Info, Contacts, Members, Notes, Files, [Groups if restricted]
  let tabIndex = 0;
  const TAB_INFO = tabIndex++;
  const TAB_CONTACTS = tabIndex++;
  const TAB_MEMBERS = tabIndex++;
  const TAB_NOTES = tabIndex++;
  const TAB_FILES = tabIndex++;
  const TAB_GROUPS = isRestricted ? tabIndex++ : -1;

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
        <Tab label={`${t('nav.contacts')} (${contacts.length})`} />
        <Tab label={`${t('leads.members', 'Members')} (${members.length})`} />
        <Tab label={t('notes.title')} />
        <Tab label={t('files.title', 'Files')} />
        {isRestricted && <Tab label={t('leads.groups', 'Access Groups')} />}
      </Tabs>

      <TabPanel value={tab} index={TAB_INFO}>
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

      <TabPanel value={tab} index={TAB_CONTACTS}>
        <Box display="flex" justifyContent="flex-end" mb={1}>
          <Tooltip title={t('leads.addContact', 'Add Contact')}>
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
              <Tooltip title={t('leads.removeContact', 'Remove')}>
                <IconButton size="small" color="error" onClick={() => handleRemoveContact(c.id)}><DeleteIcon fontSize="small" /></IconButton>
              </Tooltip>
            </CardContent>
          </Card>
        ))}
      </TabPanel>

      <TabPanel value={tab} index={TAB_MEMBERS}>
        <Box display="flex" justifyContent="flex-end" mb={1}>
          <Tooltip title={t('leads.addMember', 'Add Member')}>
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
              <Tooltip title={t('leads.removeMember', 'Remove')}>
                <IconButton size="small" color="error" onClick={() => handleRemoveMember(m.id)}><DeleteIcon fontSize="small" /></IconButton>
              </Tooltip>
            </CardContent>
          </Card>
        ))}
      </TabPanel>

      <TabPanel value={tab} index={TAB_NOTES}>
        <NotesList entityType="lead" entityId={id} />
      </TabPanel>

      <TabPanel value={tab} index={TAB_FILES}>
        <FilesList entityType="lead" entityId={id} />
      </TabPanel>

      {isRestricted && TAB_GROUPS >= 0 && (
        <TabPanel value={tab} index={TAB_GROUPS}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" mb={2}>{t('leads.groups', 'Access Groups')}</Typography>
              {groups.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('leads.noGroups', 'No groups assigned.')}
                </Typography>
              ) : groups.map(g => (
                <Box key={g.id} mb={1}>
                  <Typography variant="body2" fontWeight={500}>{g.name}</Typography>
                  {g.description && <Typography variant="caption" color="text.secondary">{g.description}</Typography>}
                </Box>
              ))}
            </CardContent>
          </Card>
        </TabPanel>
      )}

      {/* Add Contact dialog */}
      <EntityPickerDialog
        open={addContactOpen}
        onClose={() => setAddContactOpen(false)}
        onSelect={handleAddContact}
        title={t('leads.addContact', 'Add Contact')}
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
        title={t('leads.addMember', 'Add Member')}
        fetchItems={search => api.get('/users', { params: { search, limit: 50 } }).then(r => (r.data.data || r.data.items || []))}
        getLabel={u => `${u.first_name} ${u.last_name}`}
        getSubLabel={u => u.email}
        getInitials={u => `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`}
      />

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
