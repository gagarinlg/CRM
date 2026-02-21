import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, TextField, Grid, Alert, CircularProgress, Stack,
  MenuItem, Select, FormControl, InputLabel, Typography,
  Checkbox, ListItemText, OutlinedInput,
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
  const [fieldErrors, setFieldErrors] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { stage: 'new', visibility: 'public' },
  });

  const visibility = watch('visibility', 'public');

  useEffect(() => {
    Promise.allSettled([
      api.get('/companies', { params: { limit: 500 } }),
      api.get('/contacts', { params: { limit: 500 } }),
      api.get('/groups'),
    ]).then(([cRes, conRes, grpRes]) => {
      if (cRes.status === 'fulfilled') {
        const d = cRes.value.data.data || cRes.value.data;
        setCompanies(Array.isArray(d) ? d : d.items || []);
      }
      if (conRes.status === 'fulfilled') {
        const d = conRes.value.data.data || conRes.value.data;
        setContacts(Array.isArray(d) ? d : d.items || []);
      }
      if (grpRes.status === 'fulfilled') {
        const d = grpRes.value.data.data || grpRes.value.data;
        setAllGroups(Array.isArray(d) ? d : []);
      }
    });

    if (!isEdit) return;
    Promise.all([
      api.get(`/leads/${id}`),
      api.get(`/leads/${id}/groups`),
    ]).then(([leadRes, grpRes]) => {
      reset(leadRes.data.data || leadRes.data);
      const grps = grpRes.data.data || grpRes.data;
      setSelectedGroups(Array.isArray(grps) ? grps.map(g => g.id) : []);
    }).catch(() => setError(t('errors.fetchFailed')))
      .finally(() => setLoading(false));
  }, [id, isEdit, t]);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    setFieldErrors([]);
    try {
      const payload = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]));
      let leadId = id;
      if (isEdit) {
        await api.put(`/leads/${id}`, payload);
      } else {
        const res = await api.post('/leads', payload);
        leadId = (res.data.data || res.data).id;
      }
      // Sync groups when restricted
      if (data.visibility === 'restricted' && leadId) {
        const currentGroups = isEdit
          ? await api.get(`/leads/${leadId}/groups`).then(r => (r.data.data || r.data).map(g => g.id))
          : [];
        const toAdd = selectedGroups.filter(g => !currentGroups.includes(g));
        const toRemove = currentGroups.filter(g => !selectedGroups.includes(g));
        await Promise.all([
          ...toAdd.map(g => api.post(`/leads/${leadId}/groups`, { group_id: g })),
          ...toRemove.map(g => api.delete(`/leads/${leadId}/groups/${g}`)),
        ]);
      }
      navigate('/leads');
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
        title={isEdit ? t('leads.edit') : t('leads.new')}
        actions={<Button onClick={() => navigate(isEdit ? `/leads/${id}` : '/leads')}>{t('common.cancel')}</Button>}
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
                      <MenuItem key={s} value={s}>{t(`leads.stage${s.charAt(0).toUpperCase() + s.slice(1)}`)}</MenuItem>
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
              name="company_id"
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
              name="contact_id"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>{t('leads.contact')}</InputLabel>
                  <Select {...field} value={field.value || ''} label={t('leads.contact')}>
                    <MenuItem value="">{t('common.none')}</MenuItem>
                    {contacts.map(c => <MenuItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('source')} label={t('leads.source')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="visibility"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>{t('leads.visibility', 'Visibility')}</InputLabel>
                  <Select {...field} label={t('leads.visibility', 'Visibility')}>
                    <MenuItem value="public">{t('leads.visibilityPublic', 'Public (all users)')}</MenuItem>
                    <MenuItem value="restricted">{t('leads.visibilityRestricted', 'Restricted (selected groups only)')}</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          {visibility === 'restricted' && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{t('leads.groups', 'Access Groups')}</InputLabel>
                <Select
                  multiple
                  value={selectedGroups}
                  onChange={e => setSelectedGroups(e.target.value)}
                  input={<OutlinedInput label={t('leads.groups', 'Access Groups')} />}
                  renderValue={selected => allGroups.filter(g => selected.includes(g.id)).map(g => g.name).join(', ')}
                >
                  {allGroups.map(g => (
                    <MenuItem key={g.id} value={g.id}>
                      <Checkbox checked={selectedGroups.includes(g.id)} />
                      <ListItemText primary={g.name} secondary={g.description} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                {t('leads.groupsHint', 'Only members of the selected groups can see this lead.')}
              </Typography>
            </Grid>
          )}
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


