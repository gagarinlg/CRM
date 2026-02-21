import React, { useState, useEffect } from 'react';
import {
  Box, Tabs, Tab, Card, CardContent, TextField, Button, Alert,
  CircularProgress, Grid, Stack, Typography, Divider, Switch,
  FormControlLabel,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

function TabPanel({ value, index, children }) {
  return value === index ? <Box pt={2}>{children}</Box> : null;
}

function SMTPSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    api.get('/settings/smtp')
      .then(res => reset(res.data.data || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/settings/smtp', data);
      setSuccess(t('settings.smtpSaved'));
    } catch (err) {
      setError(err.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const testSmtp = async () => {
    setTesting(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/settings/smtp/test');
      setSuccess(t('settings.smtpTestSuccess'));
    } catch (err) {
      setError(err.response?.data?.message || t('settings.smtpTestFailed'));
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={8}>
          <TextField {...register('host')} label={t('settings.smtpHost')} fullWidth />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField {...register('port')} label={t('settings.smtpPort')} type="number" fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('user')} label={t('settings.smtpUser')} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('password')} label={t('settings.smtpPassword')} type="password" fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('from')} label={t('settings.smtpFrom')} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('fromName')} label={t('settings.smtpFromName')} fullWidth />
        </Grid>
      </Grid>
      <Stack direction="row" spacing={2} mt={3}>
        <Button type="submit" variant="contained" disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : t('common.save')}
        </Button>
        <Button variant="outlined" onClick={testSmtp} disabled={testing}>
          {testing ? <CircularProgress size={18} color="inherit" /> : t('settings.testSmtp')}
        </Button>
      </Stack>
    </Box>
  );
}

function ReminderSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    api.get('/settings/reminders')
      .then(res => reset(res.data.data || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/settings/reminders', data);
      setSuccess(t('settings.saved'));
    } catch (err) {
      setError(err.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField {...register('overdueContactDays')} label={t('settings.overdueContactDays')} type="number" fullWidth inputProps={{ min: 1 }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField {...register('emailReminderDays')} label={t('settings.emailReminderDays')} type="number" fullWidth inputProps={{ min: 0 }} />
        </Grid>
      </Grid>
      <Button type="submit" variant="contained" disabled={saving} sx={{ mt: 3 }}>
        {saving ? <CircularProgress size={18} color="inherit" /> : t('common.save')}
      </Button>
    </Box>
  );
}

function SystemInfo() {
  const { t } = useTranslation();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings/system')
      .then(res => setInfo(res.data.data || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!info) return <Typography color="text.secondary">{t('common.noData')}</Typography>;

  return (
    <Box>
      {Object.entries(info).map(([key, value]) => (
        <Box key={key} mb={1.5}>
          <Typography variant="caption" color="text.secondary">{key}</Typography>
          <Typography variant="body2">{String(value)}</Typography>
          <Divider sx={{ mt: 1 }} />
        </Box>
      ))}
    </Box>
  );
}

function DemoData() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [done, setDone] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/settings/demo-data');
      const result = res.data.data || res.data;
      if (result.alreadyLoaded) {
        setSuccess(t('settings.demoDataAlready'));
      } else {
        setSuccess(t('settings.demoDataSuccess'));
      }
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="body1" mb={2}>{t('settings.demoDataDescription')}</Typography>
      <Alert severity="warning" sx={{ mb: 2 }}>{t('settings.demoDataWarning')}</Alert>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Button variant="contained" onClick={handleLoad} disabled={loading || done}>
        {loading ? <CircularProgress size={18} color="inherit" /> : t('settings.demoDataLoad')}
      </Button>
    </Box>
  );
}

export default function SettingsAdmin() {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <PageHeader title={t('settings.title')} />
      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('settings.smtp')} />
          <Tab label={t('settings.reminders')} />
          <Tab label={t('settings.system')} />
          <Tab label={t('settings.demoData')} />
        </Tabs>
        <CardContent>
          <TabPanel value={tab} index={0}><SMTPSettings /></TabPanel>
          <TabPanel value={tab} index={1}><ReminderSettings /></TabPanel>
          <TabPanel value={tab} index={2}><SystemInfo /></TabPanel>
          <TabPanel value={tab} index={3}><DemoData /></TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
