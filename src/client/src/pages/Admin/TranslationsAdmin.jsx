import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Alert, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, CircularProgress,
  Chip, Stack, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm, Controller } from 'react-hook-form';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import { LANGUAGES } from '../../i18n/languages.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import useDebounce from '../../hooks/useDebounce.js';

function TranslationDialog({ open, onClose, item, onSaved }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(item?.id);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (open) reset(item || { key: '', lang: LANGUAGES[0].code, value: '', module: '' });
  }, [open, item]);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    try {
      if (isEdit) await api.put(`/i18n/${item.id}`, data);
      else await api.post('/i18n', data);
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
      <DialogTitle>{isEdit ? t('translations.edit') : t('translations.new')}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField {...register('key', { required: true })} label={t('translations.key')} fullWidth required error={!!errors.key} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="lang"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>{t('translations.language')}</InputLabel>
                    <Select {...field} label={t('translations.language')}>
                      {LANGUAGES.map(l => <MenuItem key={l.code} value={l.code}>{l.flag} {l.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField {...register('module')} label={t('translations.module')} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField {...register('value', { required: true })} label={t('translations.value')} fullWidth required multiline rows={2} error={!!errors.value} />
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

export default function TranslationsAdmin() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const debouncedSearch = useDebounce(search, 400);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (langFilter) params.lang = langFilter;
      const res = await api.get('/i18n', { params });
      const d = res.data.data || res.data;
      setItems(Array.isArray(d) ? d : []);
    } catch {
      setError(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [langFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter(item =>
    !debouncedSearch ||
    item.key?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    item.value?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleDelete = async () => {
    try {
      await api.delete(`/i18n/${deleteId}`);
      setDeleteId(null);
      fetchItems();
    } catch {
      setError(t('errors.deleteFailed'));
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <PageHeader
        title={t('translations.title')}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); setDialogOpen(true); }}>
            {t('translations.new')}
          </Button>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <SearchBar value={search} onChange={setSearch} placeholder={t('translations.searchKeys')} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t('translations.language')}</InputLabel>
          <Select value={langFilter} onChange={e => setLangFilter(e.target.value)} label={t('translations.language')}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            {LANGUAGES.map(l => <MenuItem key={l.code} value={l.code}>{l.flag} {l.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      <Paper>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>{t('translations.key')}</TableCell>
                <TableCell>{t('translations.module')}</TableCell>
                <TableCell>{t('translations.language')}</TableCell>
                <TableCell>{t('translations.value')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5}><LoadingSpinner /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">{t('common.noResults')}</TableCell></TableRow>
              ) : filtered.slice(0, 200).map(item => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{item.key}</TableCell>
                  <TableCell><Chip label={item.module || '—'} size="small" variant="outlined" /></TableCell>
                  <TableCell><Chip label={item.lang} size="small" /></TableCell>
                  <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.value}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small" onClick={() => { setEditItem(item); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(item.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <TranslationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} item={editItem} onSaved={fetchItems} />
      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t('translations.deleteTitle')}
        message={t('translations.deleteMessage')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
