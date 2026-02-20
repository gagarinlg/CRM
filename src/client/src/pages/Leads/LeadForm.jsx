import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, TextField, Grid, Alert, CircularProgress, Stack,
  MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const schema = yup.object({
  title: yup.string().required('Title is required'),
});

export default function LeadForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { stage: 'new' },
  });

  useEffect(() => {
    Promise.allSettled([
      api.get('/companies', { params: { limit: 500 } }),
      api.get('/contacts', { params: { limit: 500 } }),
    ]).then(([cRes, conRes]) => {
      if (cRes.status === 'fulfilled') {
        const d = cRes.value.data.data || cRes.value.data;
        setCompanies(Array.isArray(d) ? d : d.items || []);
      }
      if (conRes.status === 'fulfilled') {
        const d = conRes.value.data.data || conRes.value.data;
        setContacts(Array.isArray(d) ? d : d.items || []);
      }
    });

    if (!isEdit) return;
    api.get(`/leads/${id}`)
      .then(res => reset(res.data.data || res.data))
      .catch(() => setError(t('errors.fetchFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    try {
      const payload = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]));
      if (isEdit) await api.put(`/leads/${id}`, payload);
      else await api.post('/leads', payload);
      navigate('/leads');
    } catch (err) {
      setError(err.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box maxWidth={800}>
      <PageHeader
        title={isEdit ? t('leads.edit') : t('leads.new')}
        actions={<Button onClick={() => navigate(isEdit ? `/leads/${id}` : '/leads')}>{t('common.cancel')}</Button>}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField {...register('title')} label={t('leads.title_field')} fullWidth required error={!!errors.title} helperText={errors.title?.message} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Controller
              name="stage"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>{t('leads.stage')}</InputLabel>
                  <Select {...field} label={t('leads.stage')}>
                    {['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map(s => (
                      <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('value')} label={t('leads.value')} type="number" fullWidth inputProps={{ min: 0, step: 0.01 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('probability')} label={t('leads.probability')} type="number" fullWidth inputProps={{ min: 0, max: 100 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="companyId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>{t('leads.company')}</InputLabel>
                  <Select {...field} value={field.value || ''} label={t('leads.company')}>
                    <MenuItem value="">{t('common.none')}</MenuItem>
                    {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="contactId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>{t('leads.contact')}</InputLabel>
                  <Select {...field} value={field.value || ''} label={t('leads.contact')}>
                    <MenuItem value="">{t('common.none')}</MenuItem>
                    {contacts.map(c => <MenuItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('source')} label={t('leads.source')} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField {...register('notes')} label={t('common.notes')} fullWidth multiline rows={3} />
          </Grid>
        </Grid>
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
          <Button onClick={() => navigate(isEdit ? `/leads/${id}` : '/leads')}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : t('common.save')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
