import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Chip, Alert, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, CircularProgress,
  Stack, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm, Controller } from 'react-hook-form';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import useDebounce from '../../hooks/useDebounce.js';

function UserDialog({ open, onClose, user, roles, onSaved }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(user?.id);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: { firstName: '', lastName: '', email: '', password: '', role: 'user' },
  });

  useEffect(() => {
    if (open) reset(user || { firstName: '', lastName: '', email: '', password: '', role: 'user' });
  }, [open, user]);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    try {
      const payload = { ...data };
      if (isEdit && !payload.password) delete payload.password;
      if (isEdit) await api.put(`/users/${user.id}`, payload);
      else await api.post('/users', payload);
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
      <DialogTitle>{isEdit ? t('users.edit') : t('users.new')}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField {...register('firstName', { required: true })} label={t('users.firstName')} fullWidth required error={!!errors.firstName} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField {...register('lastName', { required: true })} label={t('users.lastName')} fullWidth required error={!!errors.lastName} />
            </Grid>
            <Grid item xs={12}>
              <TextField {...register('email', { required: true })} label={t('users.email')} type="email" fullWidth required error={!!errors.email} />
            </Grid>
            <Grid item xs={12}>
              <TextField {...register('password')} label={isEdit ? t('users.newPassword') : t('users.password')} type="password" fullWidth required={!isEdit} />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>{t('users.role')}</InputLabel>
                    <Select {...field} label={t('users.role')}>
                      {roles.map(r => <MenuItem key={r.id} value={r.name}>{r.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
              />
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

export default function UsersAdmin() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const debouncedSearch = useDebounce(search, 400);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.allSettled([
        api.get('/users', { params: { limit: 500 } }),
        api.get('/roles'),
      ]);
      if (uRes.status === 'fulfilled') {
        const d = uRes.value.data.data || uRes.value.data;
        setUsers(Array.isArray(d) ? d : d.items || []);
      }
      if (rRes.status === 'fulfilled') {
        const d = rRes.value.data.data || rRes.value.data;
        setRoles(Array.isArray(d) ? d : []);
      }
    } catch {
      setError(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = users.filter(u =>
    !debouncedSearch || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch {
      setError(t('errors.deleteFailed'));
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <PageHeader
        title={t('users.title')}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditUser(null); setDialogOpen(true); }}>
            {t('users.new')}
          </Button>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Stack direction="row" spacing={2} mb={2}>
        <SearchBar value={search} onChange={setSearch} />
      </Stack>

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('users.name')}</TableCell>
                <TableCell>{t('users.email')}</TableCell>
                <TableCell>{t('users.role')}</TableCell>
                <TableCell>{t('users.status')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5}><LoadingSpinner /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">{t('common.noResults')}</TableCell></TableRow>
              ) : filtered.map(u => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.firstName} {u.lastName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    {(u.roles || []).map(r => (
                      <Chip key={r.id || r} label={r.name || r} size="small" sx={{ mr: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.isActive !== false ? t('users.active') : t('users.inactive')}
                      color={u.isActive !== false ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small" onClick={() => { setEditUser(u); setDialogOpen(true); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(u.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <UserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        user={editUser}
        roles={roles}
        onSaved={fetchData}
      />
      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t('users.deleteTitle')}
        message={t('users.deleteMessage')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
