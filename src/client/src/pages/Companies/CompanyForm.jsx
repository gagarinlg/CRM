import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, TextField, Grid, Alert, CircularProgress, Stack,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').nullable(),
  website: yup.string().nullable().transform(v => v === '' ? null : v).url('Invalid URL'),
});

export default function CompanyForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/companies/${id}`)
      .then(res => reset(res.data.data || res.data))
      .catch(() => setError(t('errors.fetchFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    try {
      // Strip empty strings to null
      const payload = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === '' ? null : v])
      );
      if (isEdit) await api.put(`/companies/${id}`, payload);
      else await api.post('/companies', payload);
      navigate('/companies');
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
        title={isEdit ? t('companies.edit') : t('companies.new')}
        actions={
          <Button onClick={() => navigate(isEdit ? `/companies/${id}` : '/companies')}>
            {t('common.cancel')}
          </Button>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField {...register('name')} label={t('companies.name')} fullWidth required error={!!errors.name} helperText={errors.name?.message} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('industry')} label={t('companies.industry')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('email')} label={t('companies.email')} type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('phone')} label={t('companies.phone')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('website')} label={t('companies.website')} fullWidth error={!!errors.website} helperText={errors.website?.message} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('vat_number')} label={t('companies.vatNumber')} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField {...register('address')} label={t('companies.address')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField {...register('city')} label={t('companies.city')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField {...register('postal_code')} label={t('companies.postalCode')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField {...register('country')} label={t('companies.country')} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField {...register('notes')} label={t('common.notes')} fullWidth multiline rows={3} />
          </Grid>
        </Grid>
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
          <Button onClick={() => navigate(isEdit ? `/companies/${id}` : '/companies')}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : t('common.save')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
