import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Alert, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, CircularProgress,
  Chip, Stack, MenuItem, Select, FormControl, InputLabel, Tabs, Tab,
  Switch, FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LanguageIcon from '@mui/icons-material/Language';
import { useForm, Controller } from 'react-hook-form';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import { LANGUAGE_FLAGS } from '../../i18n/languages.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import useDebounce from '../../hooks/useDebounce.js';

function LanguageDialog({ open, onClose, lang, onSaved }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(lang?.id);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    if (open) reset(lang || { code: '', name: '', is_active: true, is_default: false });
  }, [open, lang, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    try {
      if (isEdit) await api.put(`/i18n/admin/languages/${lang.id}`, data);
      else await api.post('/i18n/admin/languages', data);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{isEdit ? t('translations.editLanguage') : t('translations.newLanguage')}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                {...register('code', { required: true })}
                label={t('translations.langCode')}
                fullWidth required disabled={isEdit}
                error={!!errors.code}
                inputProps={{ maxLength: 10 }}
                placeholder="en"
              />
            </Grid>
            <Grid item xs={8}>
              <TextField
                {...register('name', { required: true })}
                label={t('translations.langName')}
                fullWidth required error={!!errors.name}
                placeholder="English"
              />
            </Grid>
            <Grid item xs={6}>
              <Controller name="is_active" control={control} render={({ field }) => (
                <FormControlLabel control={<Switch {...field} checked={!!field.value} />} label={t('common.active')} />
              )} />
            </Grid>
            <Grid item xs={6}>
              <Controller name="is_default" control={control} render={({ field }) => (
                <FormControlLabel control={<Switch {...field} checked={!!field.value} />} label={t('translations.default')} />
              )} />
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

function LanguagesTab() {
  const { t } = useTranslation();
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLang, setEditLang] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const fetchLanguages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/i18n/admin/languages');
      const d = res.data.data || res.data;
      setLanguages(Array.isArray(d) ? d : []);
    } catch {
      setError(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchLanguages(); }, [fetchLanguages]);

  const handleDelete = async () => {
    try {
      await api.delete(`/i18n/admin/languages/${deleteId}`);
      setDeleteId(null);
      fetchLanguages();
    } catch {
      setError(t('errors.deleteFailed'));
      setDeleteId(null);
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditLang(null); setDialogOpen(true); }}>
          {t('translations.newLanguage')}
        </Button>
      </Box>
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('translations.langCode')}</TableCell>
                <TableCell>{t('translations.langName')}</TableCell>
                <TableCell>{t('common.active')}</TableCell>
                <TableCell>{t('translations.default')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5}><LoadingSpinner /></TableCell></TableRow>
              ) : languages.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">{t('common.noResults')}</TableCell></TableRow>
              ) : languages.map(lang => (
                <TableRow key={lang.id} hover>
                  <TableCell>
                    <Chip label={`${LANGUAGE_FLAGS[lang.code] || '🌐'} ${lang.code.toUpperCase()}`} size="small" />
                  </TableCell>
                  <TableCell>{lang.name}</TableCell>
                  <TableCell>
                    <Chip label={lang.is_active ? t('common.yes') : t('common.no')} size="small"
                      color={lang.is_active ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell>
                    {lang.is_default && <Chip label={t('translations.default')} size="small" color="primary" />}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small" onClick={() => { setEditLang(lang); setDialogOpen(true); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(lang.id)}>
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
      <LanguageDialog open={dialogOpen} onClose={() => setDialogOpen(false)} lang={editLang} onSaved={fetchLanguages} />
      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t('translations.deleteLanguageTitle')}
        message={t('translations.deleteLanguageMessage')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}

function TranslationDialog({ open, onClose, item, onSaved, availableLanguages }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(item?.id);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();
  const defaultLang = availableLanguages[0]?.code || 'en';

  useEffect(() => {
    if (open) reset(item || { key: '', language_code: defaultLang, value: '', module: '' });
  }, [open, item, defaultLang, reset]);

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
              <Controller name="language_code" control={control} render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>{t('translations.language')}</InputLabel>
                  <Select {...field} label={t('translations.language')}>
                    {availableLanguages.map(l => (
                      <MenuItem key={l.code} value={l.code}>
                        {LANGUAGE_FLAGS[l.code] || '🌐'} {l.code.toUpperCase()} – {l.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )} />
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
  const [tabIndex, setTabIndex] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    api.get('/i18n/admin/languages').then(res => {
      const d = res.data.data || res.data;
      if (Array.isArray(d)) setAvailableLanguages(d);
    }).catch(() => {});
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (langFilter) params.language_code = langFilter;
      const res = await api.get('/i18n', { params });
      const d = res.data.data || res.data;
      setItems(Array.isArray(d) ? d : []);
    } catch {
      setError(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [langFilter, t]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter(item =>
    !debouncedSearch ||
    item.key?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    item.value?.toLowerCase().includes(debouncedSearch.toLowerCase()),
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
        actions={tabIndex === 0 ? (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); setDialogOpen(true); }}>
            {t('translations.new')}
          </Button>
        ) : null}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 2 }}>
        <Tab label={t('translations.keys')} />
        <Tab label={t('translations.languages')} icon={<LanguageIcon />} iconPosition="start" />
      </Tabs>

      {tabIndex === 0 && (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
            <SearchBar value={search} onChange={setSearch} placeholder={t('translations.searchKeys')} />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>{t('translations.language')}</InputLabel>
              <Select value={langFilter} onChange={e => setLangFilter(e.target.value)} label={t('translations.language')}>
                <MenuItem value="">{t('common.all')}</MenuItem>
                {availableLanguages.map(l => (
                  <MenuItem key={l.code} value={l.code}>
                    {LANGUAGE_FLAGS[l.code] || '🌐'} {l.code.toUpperCase()} – {l.name}
                  </MenuItem>
                ))}
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
                      <TableCell>
                        {(() => { const lc = item.language_code || item.lang || ''; return <Chip label={`${LANGUAGE_FLAGS[lc] || '🌐'} ${lc.toUpperCase()}`} size="small" />; })()}
                      </TableCell>
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
          <TranslationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} item={editItem} onSaved={fetchItems} availableLanguages={availableLanguages} />
          <ConfirmDialog open={Boolean(deleteId)} title={t('translations.deleteTitle')} message={t('translations.deleteMessage')} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
        </>
      )}

      {tabIndex === 1 && <LanguagesTab />}
    </Box>
  );
}
