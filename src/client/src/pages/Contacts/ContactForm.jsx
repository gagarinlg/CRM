import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, TextField, Grid, Alert, CircularProgress, Stack, MenuItem,
  Select, FormControl, InputLabel, IconButton, Typography, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const PHONE_LABELS = ['mobile', 'work', 'home', 'fax', 'other'];

const schema = yup.object({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email address').required('Email address is required'),
  phones: yup.array().of(
    yup.object({
      phone_number: yup.string(),
      label: yup.string().oneOf(PHONE_LABELS).default('work'),
    }),
  ),
});

export default function ContactForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [companies, setCompanies] = useState([]);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { phones: [{ phone_number: '', label: 'work' }] },
  });

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control,
    name: 'phones',
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
      .then(res => {
        const contact = res.data.data || res.data;
        reset({
          ...contact,
          phones: (contact.phones && contact.phones.length > 0)
            ? contact.phones
            : [{ phone_number: '', label: 'work' }],
        });
      })
      .catch(() => setError(t('errors.fetchFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    setFieldErrors([]);
    try {
      // Remove empty phone entries
      const phones = (data.phones || []).filter(p => p.phone_number.trim() !== '');
      const payload = { ...data, phones };
      if (isEdit) await api.put(`/contacts/${id}`, payload);
      else await api.post('/contacts', payload);
      navigate('/contacts');
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors?.length) {
        setFieldErrors(apiErrors);
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || t('errors.saveFailed'));
      }
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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          {fieldErrors.length > 0 && (
            <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
              {fieldErrors.map((e, i) => (
                <li key={i}><strong>{e.field}</strong>: {e.message}</li>
              ))}
            </ul>
          )}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2}>
          {/* Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              {...register('first_name')}
              label={t('contacts.firstName')}
              fullWidth required
              error={!!errors.first_name}
              helperText={errors.first_name?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              {...register('last_name')}
              label={t('contacts.lastName')}
              fullWidth required
              error={!!errors.last_name}
              helperText={errors.last_name?.message}
            />
          </Grid>

          {/* Required email */}
          <Grid item xs={12} sm={6}>
            <TextField
              {...register('email')}
              label={`${t('contacts.email')} *`}
              type="email"
              fullWidth required
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Grid>

          {/* Job title */}
          <Grid item xs={12} sm={6}>
            <TextField {...register('position')} label={t('contacts.jobTitle')} fullWidth />
          </Grid>

          {/* Company */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="company_id"
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

          {/* Phone numbers — dynamic list */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2">Phone numbers</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => appendPhone({ phone_number: '', label: 'mobile' })}
              >
                Add phone
              </Button>
            </Box>

            {phoneFields.map((field, index) => (
              <Stack key={field.id} direction="row" spacing={1} alignItems="flex-start" mb={1}>
                <Controller
                  name={`phones.${index}.label`}
                  control={control}
                  render={({ field: f }) => (
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                      <Select {...f} value={f.value || 'work'}>
                        {PHONE_LABELS.map(l => (
                          <MenuItem key={l} value={l}>
                            {l.charAt(0).toUpperCase() + l.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
                <TextField
                  {...register(`phones.${index}.phone_number`)}
                  label="Phone number"
                  size="small"
                  sx={{ flex: 1 }}
                  error={!!errors.phones?.[index]?.phone_number}
                  helperText={errors.phones?.[index]?.phone_number?.message}
                  inputProps={{ type: 'tel' }}
                />
                <IconButton
                  onClick={() => removePhone(index)}
                  disabled={phoneFields.length === 1}
                  size="small"
                  color="error"
                  title="Remove phone"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
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
