import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, TextField, Grid, Alert, CircularProgress, Stack,
  MenuItem, Select, FormControl, InputLabel, Slider, Typography,
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
  name: yup.string().required('Name is required'),
});

export default function ProjectForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { status: 'planning', progress: 0, visibility: 'public' },
  });

  const progress = watch('progress', 0);
  const visibility = watch('visibility', 'public');

  useEffect(() => {
    api.get('/groups').then(res => {
      const data = res.data.data || res.data;
      setAllGroups(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/projects/${id}/groups`),
    ]).then(([projRes, grpRes]) => {
      reset(projRes.data.data || projRes.data);
      const grps = grpRes.data.data || grpRes.data;
      setSelectedGroups(Array.isArray(grps) ? grps.map(g => g.id) : []);
    }).catch(() => setError(t('errors.fetchFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    setFieldErrors([]);
    try {
      const payload = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]));
      let projectId = id;
      if (isEdit) {
        await api.put(`/projects/${id}`, payload);
      } else {
        const res = await api.post('/projects', payload);
        projectId = (res.data.data || res.data).id;
      }
      // Sync groups when restricted
      if (data.visibility === 'restricted' && projectId) {
        const currentGroups = isEdit
          ? await api.get(`/projects/${projectId}/groups`).then(r => (r.data.data || r.data).map(g => g.id))
          : [];
        const toAdd = selectedGroups.filter(g => !currentGroups.includes(g));
        const toRemove = currentGroups.filter(g => !selectedGroups.includes(g));
        await Promise.all([
          ...toAdd.map(g => api.post(`/projects/${projectId}/groups`, { group_id: g })),
          ...toRemove.map(g => api.delete(`/projects/${projectId}/groups/${g}`)),
        ]);
      }
      navigate('/projects');
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
        title={isEdit ? t('projects.edit') : t('projects.new')}
        actions={<Button onClick={() => navigate(isEdit ? `/projects/${id}` : '/projects')}>{t('common.cancel')}</Button>}
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
            <TextField {...register('name')} label={t('projects.name')} fullWidth required error={!!errors.name} helperText={errors.name?.message} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>{t('projects.status')}</InputLabel>
                  <Select {...field} label={t('projects.status')}>
                    <MenuItem value="planning">Planning</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="on_hold">On Hold</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField {...register('description')} label={t('common.description')} fullWidth multiline rows={2} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('start_date')} label={t('projects.startDate')} type="date" fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('end_date')} label={t('projects.endDate')} type="date" fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('budget')} label={t('projects.budget')} type="number" fullWidth inputProps={{ min: 0, step: 0.01 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="visibility"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>{t('projects.visibility')}</InputLabel>
                  <Select {...field} label={t('projects.visibility')}>
                    <MenuItem value="public">{t('projects.visibilityPublic')}</MenuItem>
                    <MenuItem value="restricted">{t('projects.visibilityRestricted')}</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          {visibility === 'restricted' && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{t('projects.groups')}</InputLabel>
                <Select
                  multiple
                  value={selectedGroups}
                  onChange={e => setSelectedGroups(e.target.value)}
                  input={<OutlinedInput label={t('projects.groups')} />}
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
              <Typography variant="caption" color="text.secondary">{t('projects.groupsHint')}</Typography>
            </Grid>
          )}
          <Grid item xs={12}>
            <Typography variant="body2" gutterBottom>{t('projects.progress')}: {progress}%</Typography>
            <Controller
              name="progress"
              control={control}
              render={({ field }) => (
                <Slider {...field} min={0} max={100} step={5} valueLabelDisplay="auto" />
              )}
            />
          </Grid>
        </Grid>
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
          <Button onClick={() => navigate(isEdit ? `/projects/${id}` : '/projects')}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : t('common.save')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

const schema = yup.object({
  name: yup.string().required('Name is required'),
});

export default function ProjectForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { status: 'planning', progress: 0 },
  });

  const progress = watch('progress', 0);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/projects/${id}`)
      .then(res => reset(res.data.data || res.data))
      .catch(() => setError(t('errors.fetchFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    setFieldErrors([]);
    try {
      const payload = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]));
      if (isEdit) await api.put(`/projects/${id}`, payload);
      else await api.post('/projects', payload);
      navigate('/projects');
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
        title={isEdit ? t('projects.edit') : t('projects.new')}
        actions={<Button onClick={() => navigate(isEdit ? `/projects/${id}` : '/projects')}>{t('common.cancel')}</Button>}
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
            <TextField {...register('name')} label={t('projects.name')} fullWidth required error={!!errors.name} helperText={errors.name?.message} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>{t('projects.status')}</InputLabel>
                  <Select {...field} label={t('projects.status')}>
                    <MenuItem value="planning">Planning</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="on_hold">On Hold</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField {...register('description')} label={t('common.description')} fullWidth multiline rows={2} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('start_date')} label={t('projects.startDate')} type="date" fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('end_date')} label={t('projects.endDate')} type="date" fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...register('budget')} label={t('projects.budget')} type="number" fullWidth inputProps={{ min: 0, step: 0.01 }} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" gutterBottom>{t('projects.progress')}: {progress}%</Typography>
            <Controller
              name="progress"
              control={control}
              render={({ field }) => (
                <Slider {...field} min={0} max={100} step={5} valueLabelDisplay="auto" />
              )}
            />
          </Grid>
        </Grid>
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
          <Button onClick={() => navigate(isEdit ? `/projects/${id}` : '/projects')}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : t('common.save')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
