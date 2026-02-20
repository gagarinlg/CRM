import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, TextField, Grid, Alert, CircularProgress, Stack, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').nullable(),
});

export default function ContactForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState([]);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    api.get('/companies', { params: { limit: 500 } })
      .then(res => {
        const data = res.data.data || res.data;
        setCompanies(Array.isArray(data) ? data : data.items || []);
      })
      .catch(() => {});

    if (!isEdit) return;
    api.get(`/contacts/${id}`)
      .then(res => reset(res.data.data || res.data))
      .catch(() => setError(t('errors.fetchFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    try {
      const payload = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]));
      if (isEdit) await api.put(`/contacts/${id}`, payload);
      else await api.post('/contacts', payload);
      navigate('/contacts');
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
        title={isEdit ? t('contacts.edit') : t('contacts.new')}
        actions={<Button onClick={() => navigate(isEdit ? `/contacts/${id}` : '/contacts')}>{t('common.cancel')}</Button>}
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField {...register('firstName')} label={t('contacts.firstName')} fullWidth required error={!!errors.firstName} helperText={errors.firstName?.message} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('lastName')} label={t('contacts.lastName')} fullWidth required error={!!errors.lastName} helperText={errors.lastName?.message} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('email')} label={t('contacts.email')} type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('phone')} label={t('contacts.phone')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('mobile')} label={t('contacts.mobile')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('jobTitle')} label={t('contacts.jobTitle')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="companyId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>{t('contacts.company')}</InputLabel>
                  <Select {...field} value={field.value || ''} label={t('contacts.company')}>
                    <MenuItem value="">{t('common.none')}</MenuItem>
                    {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('address')} label={t('contacts.address')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField {...register('city')} label={t('companies.city')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField {...register('postalCode')} label={t('companies.postalCode')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField {...register('country')} label={t('companies.country')} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField {...register('notes')} label={t('common.notes')} fullWidth multiline rows={3} />
          </Grid>
        </Grid>
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
          <Button onClick={() => navigate(isEdit ? `/contacts/${id}` : '/contacts')}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : t('common.save')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
