import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Alert, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, CircularProgress,
  Chip, List, ListItem, ListItemText, Checkbox, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import { useForm } from 'react-hook-form';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';

function GroupDialog({ open, onClose, group, onSaved }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(group?.id);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (open) reset(group || { name: '', description: '' });
  }, [open, group]);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    try {
      if (isEdit) await api.put(`/groups/${group.id}`, data);
      else await api.post('/groups', data);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? t('groups.edit') : t('groups.new')}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField {...register('name', { required: true })} label={t('groups.name')} fullWidth required error={!!errors.name} />
            </Grid>
            <Grid item xs={12}>
              <TextField {...register('description')} label={t('groups.description')} fullWidth multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : t('common.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function MembersDialog({ open, onClose, group }) {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !group) return;
    setLoading(true);
    Promise.allSettled([
      api.get(`/groups/${group.id}/members`),
      api.get('/users', { params: { limit: 500 } }),
    ]).then(([mRes, uRes]) => {
      if (mRes.status === 'fulfilled') {
        const d = mRes.value.data.data || mRes.value.data;
        setMembers((Array.isArray(d) ? d : []).map(m => m.id || m));
      }
      if (uRes.status === 'fulfilled') {
        const d = uRes.value.data.data || uRes.value.data;
        setAllUsers(Array.isArray(d) ? d : d.items || []);
      }
      setLoading(false);
    });
  }, [open, group]);

  const toggle = async (userId) => {
    setSaving(true);
    try {
      if (members.includes(userId)) {
        await api.delete(`/groups/${group.id}/members/${userId}`);
        setMembers(m => m.filter(id => id !== userId));
      } else {
        await api.post(`/groups/${group.id}/members`, { user_id: userId });
        setMembers(m => [...m, userId]);
      }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('groups.members')} — {group?.name}</DialogTitle>
      <DialogContent>
        {loading ? <LoadingSpinner /> : (
          <List dense>
            {allUsers.map(u => (
              <ListItem key={u.id} dense button onClick={() => toggle(u.id)} disabled={saving}>
                <Checkbox edge="start" checked={members.includes(u.id)} tabIndex={-1} disableRipple />
                <ListItemText primary={`${u.firstName} ${u.lastName}`} secondary={u.email} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function GroupsAdmin() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [membersGroup, setMembersGroup] = useState(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/groups');
      const d = res.data.data || res.data;
      setGroups(Array.isArray(d) ? d : []);
    } catch {
      setError(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleDelete = async () => {
    try {
      await api.delete(`/groups/${deleteId}`);
      setDeleteId(null);
      fetchGroups();
    } catch {
      setError(t('errors.deleteFailed'));
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <PageHeader
        title={t('groups.title')}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditGroup(null); setDialogOpen(true); }}>
            {t('groups.new')}
          </Button>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('groups.name')}</TableCell>
                <TableCell>{t('groups.description')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3}><LoadingSpinner /></TableCell></TableRow>
              ) : groups.length === 0 ? (
                <TableRow><TableCell colSpan={3} align="center">{t('common.noResults')}</TableCell></TableRow>
              ) : groups.map(g => (
                <TableRow key={g.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{g.name}</TableCell>
                  <TableCell>{g.description}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('groups.members')}>
                      <IconButton size="small" onClick={() => setMembersGroup(g)}><PeopleIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small" onClick={() => { setEditGroup(g); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(g.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <GroupDialog open={dialogOpen} onClose={() => setDialogOpen(false)} group={editGroup} onSaved={fetchGroups} />
      <MembersDialog open={Boolean(membersGroup)} onClose={() => setMembersGroup(null)} group={membersGroup} />
      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t('groups.deleteTitle')}
        message={t('groups.deleteMessage')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
