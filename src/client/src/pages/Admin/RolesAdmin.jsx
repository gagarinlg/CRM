import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Alert, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, CircularProgress,
  Typography, Chip, List, ListItem, ListItemText, Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import { useForm } from 'react-hook-form';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';

function RoleDialog({ open, onClose, role, onSaved }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(role?.id);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (open) reset(role || { name: '', description: '' });
  }, [open, role]);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    try {
      if (isEdit) await api.put(`/roles/${role.id}`, data);
      else await api.post('/roles', data);
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
      <DialogTitle>{isEdit ? t('roles.edit') : t('roles.new')}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField {...register('name', { required: true })} label={t('roles.name')} fullWidth required error={!!errors.name} />
            </Grid>
            <Grid item xs={12}>
              <TextField {...register('description')} label={t('roles.description')} fullWidth multiline rows={2} />
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

function PermissionsDialog({ open, onClose, role }) {
  const { t } = useTranslation();
  const [permissions, setPermissions] = useState([]);
  const [rolePerms, setRolePerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !role) return;
    setLoading(true);
    Promise.allSettled([
      api.get('/roles/permissions'),
      api.get(`/roles/${role.id}/permissions`),
    ]).then(([pRes, rpRes]) => {
      if (pRes.status === 'fulfilled') {
        const d = pRes.value.data.data || pRes.value.data;
        setPermissions(Array.isArray(d) ? d : []);
      }
      if (rpRes.status === 'fulfilled') {
        const d = rpRes.value.data.data || rpRes.value.data;
        setRolePerms((Array.isArray(d) ? d : []).map(p => p.id || p));
      }
      setLoading(false);
    });
  }, [open, role]);

  const toggle = async (permId) => {
    setSaving(true);
    try {
      if (rolePerms.includes(permId)) {
        await api.delete(`/roles/${role.id}/permissions/${permId}`);
        setRolePerms(p => p.filter(id => id !== permId));
      } else {
        await api.post(`/roles/${role.id}/permissions`, { permission_id: permId });
        setRolePerms(p => [...p, permId]);
      }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('roles.permissions')} — {role?.name}</DialogTitle>
      <DialogContent>
        {loading ? <LoadingSpinner /> : (
          <List dense>
            {permissions.map(p => (
              <ListItem key={p.id} dense button onClick={() => toggle(p.id)} disabled={saving}>
                <Checkbox edge="start" checked={rolePerms.includes(p.id)} tabIndex={-1} disableRipple />
                <ListItemText
                  primary={t(`permissions.${p.name}`, p.name)}
                  secondary={p.description}
                />
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

export default function RolesAdmin() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [permsRole, setPermsRole] = useState(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/roles');
      const d = res.data.data || res.data;
      setRoles(Array.isArray(d) ? d : []);
    } catch {
      setError(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const handleDelete = async () => {
    try {
      await api.delete(`/roles/${deleteId}`);
      setDeleteId(null);
      fetchRoles();
    } catch {
      setError(t('errors.deleteFailed'));
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <PageHeader
        title={t('roles.title')}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditRole(null); setDialogOpen(true); }}>
            {t('roles.new')}
          </Button>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('roles.name')}</TableCell>
                <TableCell>{t('roles.description')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3}><LoadingSpinner /></TableCell></TableRow>
              ) : roles.length === 0 ? (
                <TableRow><TableCell colSpan={3} align="center">{t('common.noResults')}</TableCell></TableRow>
              ) : roles.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell><Chip label={r.name} size="small" /></TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('roles.permissions')}>
                      <IconButton size="small" onClick={() => setPermsRole(r)}><SecurityIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small" onClick={() => { setEditRole(r); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(r.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <RoleDialog open={dialogOpen} onClose={() => setDialogOpen(false)} role={editRole} onSaved={fetchRoles} />
      <PermissionsDialog open={Boolean(permsRole)} onClose={() => setPermsRole(null)} role={permsRole} />
      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t('roles.deleteTitle')}
        message={t('roles.deleteMessage')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
