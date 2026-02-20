import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Alert, CircularProgress,
  Grid, Typography, Divider, Avatar, Stack,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../store/AuthContext.jsx';
import { useTranslation } from '../i18n/I18nContext.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import api from '../services/api.js';

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().min(8, 'Minimum 8 characters').required('New password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('newPassword')], 'Passwords must match').required(),
});

export default function Profile() {
  const { user, loadUser } = useAuth();
  const { t } = useTranslation();
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const { register: registerProfile, handleSubmit: handleProfile } = useForm({
    defaultValues: { firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '' },
  });

  const { register: registerPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { errors: pwdErrors } } = useForm({
    resolver: yupResolver(passwordSchema),
  });

  const onProfileSubmit = async (data) => {
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      await api.put(`/users/${user.id}`, data);
      await loadUser();
      setProfileSuccess(t('profile.saved'));
    } catch (err) {
      setProfileError(err.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setProfileSaving(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPwdSaving(true);
    setPwdError('');
    setPwdSuccess('');
    try {
      await api.post('/auth/change-password', { current_password: data.currentPassword, new_password: data.newPassword });
      resetPwd();
      setPwdSuccess(t('profile.passwordChanged'));
    } catch (err) {
      setPwdError(err.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setPwdSaving(false);
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <Box maxWidth={700}>
      <PageHeader title={t('profile.title')} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 28 }}>
                {initials}
              </Avatar>
              <Typography variant="h6">{user?.firstName} {user?.lastName}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              {user?.roles?.map(r => (
                <Typography key={r.id || r} variant="caption" display="block" color="primary" mt={0.5}>
                  {r.name || r}
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" mb={2}>{t('profile.personalInfo')}</Typography>
              {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}
              {profileSuccess && <Alert severity="success" sx={{ mb: 2 }}>{profileSuccess}</Alert>}
              <Box component="form" onSubmit={handleProfile(onProfileSubmit)}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField {...registerProfile('firstName')} label={t('users.firstName')} fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField {...registerProfile('lastName')} label={t('users.lastName')} fullWidth />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField {...registerProfile('email')} label={t('users.email')} type="email" fullWidth />
                  </Grid>
                </Grid>
                <Button type="submit" variant="contained" disabled={profileSaving} sx={{ mt: 2 }}>
                  {profileSaving ? <CircularProgress size={18} color="inherit" /> : t('common.save')}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle2" mb={2}>{t('profile.changePassword')}</Typography>
              {pwdError && <Alert severity="error" sx={{ mb: 2 }}>{pwdError}</Alert>}
              {pwdSuccess && <Alert severity="success" sx={{ mb: 2 }}>{pwdSuccess}</Alert>}
              <Box component="form" onSubmit={handlePwd(onPasswordSubmit)}>
                <Stack spacing={2}>
                  <TextField {...registerPwd('currentPassword')} label={t('profile.currentPassword')} type="password" fullWidth error={!!pwdErrors.currentPassword} helperText={pwdErrors.currentPassword?.message} />
                  <TextField {...registerPwd('newPassword')} label={t('profile.newPassword')} type="password" fullWidth error={!!pwdErrors.newPassword} helperText={pwdErrors.newPassword?.message} />
                  <TextField {...registerPwd('confirmPassword')} label={t('profile.confirmPassword')} type="password" fullWidth error={!!pwdErrors.confirmPassword} helperText={pwdErrors.confirmPassword?.message} />
                </Stack>
                <Button type="submit" variant="contained" disabled={pwdSaving} sx={{ mt: 2 }}>
                  {pwdSaving ? <CircularProgress size={18} color="inherit" /> : t('profile.changePassword')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
