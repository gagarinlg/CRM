import React, { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Alert, CircularProgress,
  Grid, Typography, Divider, Avatar, Stack, Chip,
  MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import SecurityIcon from '@mui/icons-material/Security';
import { useAuth } from '../store/AuthContext.jsx';
import { useTranslation } from '../i18n/I18nContext.jsx';
import { LANGUAGE_FLAGS } from '../i18n/languages.js';
import PageHeader from '../components/common/PageHeader.jsx';
import api from '../services/api.js';

export default function Profile() {
  const { user, loadUser } = useAuth();
  const { t, languages, changeLocale, locale } = useTranslation();
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [langSaving, setLangSaving] = useState(false);
  // 2FA state
  const [totpStep, setTotpStep] = useState('idle'); // idle | setup | verify | done | disable
  const [totpData, setTotpData] = useState(null);   // { secret, qr_image, qr_url }
  const [backupCodes, setBackupCodes] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [totpError, setTotpError] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);

  const profileSchema = useMemo(() => yup.object({
    firstName: yup.string().required(t('validation.firstNameRequired')),
    lastName: yup.string().required(t('validation.lastNameRequired')),
    email: yup.string().email(t('validation.emailInvalid')).required(t('validation.emailRequired')),
  }), [t]);

  const passwordSchema = useMemo(() => yup.object({
    currentPassword: yup.string().required(t('validation.currentPasswordRequired')),
    newPassword: yup.string().min(8, t('auth.minPassword')).required(t('validation.newPasswordRequired')),
    confirmPassword: yup.string().oneOf([yup.ref('newPassword')], t('auth.passwordsMustMatch')).required(t('validation.confirmPasswordRequired')),
  }), [t]);

  const { register: registerProfile, handleSubmit: handleProfile, formState: { errors: profileErrors } } = useForm({
    resolver: yupResolver(profileSchema),
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

  const handleLanguageChange = async (lang) => {
    setLangSaving(true);
    changeLocale(lang);
    try {
      await api.put(`/users/${user.id}`, { preferred_language: lang });
      await loadUser();
    } catch { /* non-fatal */ } finally {
      setLangSaving(false);
    }
  };

  // ── 2FA handlers ──

  const handleSetup2FA = async () => {
    setTotpLoading(true);
    setTotpError('');
    try {
      const res = await api.post('/auth/2fa/setup');
      setTotpData(res.data.data || res.data);
      setTotpStep('setup');
    } catch (err) {
      setTotpError(err.response?.data?.message || t('auth.totpSetupFailed'));
    } finally {
      setTotpLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    setTotpLoading(true);
    setTotpError('');
    try {
      const res = await api.post('/auth/2fa/verify-setup', { totp_token: totpCode });
      setBackupCodes((res.data.data || res.data).backup_codes);
      setTotpStep('done');
      await loadUser();
    } catch (err) {
      setTotpError(err.response?.data?.message || t('auth.totpInvalid'));
    } finally {
      setTotpLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setTotpLoading(true);
    setTotpError('');
    try {
      await api.post('/auth/2fa/disable', { password: disablePassword });
      setTotpStep('idle');
      setDisablePassword('');
      await loadUser();
    } catch (err) {
      setTotpError(err.response?.data?.message || t('auth.totpDisableFailed'));
    } finally {
      setTotpLoading(false);
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || user.first_name?.[0] || ''}${user.lastName?.[0] || user.last_name?.[0] || ''}`.toUpperCase()
    : '?';

  const totpEnabled = user?.totp_enabled;

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
              <Typography variant="h6">{user?.firstName || user?.first_name} {user?.lastName || user?.last_name}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              {user?.roles?.map(r => (
                <Typography key={r.id || r} variant="caption" display="block" color="primary" mt={0.5}>
                  {r.name || r}
                </Typography>
              ))}
              <Box mt={1}>
                {totpEnabled
                  ? <Chip icon={<SecurityIcon />} label={t('profile.twoFactorEnabled')} color="success" size="small" />
                  : <Chip icon={<SecurityIcon />} label={t('profile.twoFactorDisabled')} color="default" size="small" />}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {/* ── Personal Info ── */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" mb={2}>{t('profile.personalInfo')}</Typography>
              {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}
              {profileSuccess && <Alert severity="success" sx={{ mb: 2 }}>{profileSuccess}</Alert>}
              <Box component="form" onSubmit={handleProfile(onProfileSubmit)}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField {...registerProfile('firstName')} label={t('users.firstName')} fullWidth required error={!!profileErrors.firstName} helperText={profileErrors.firstName?.message} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField {...registerProfile('lastName')} label={t('users.lastName')} fullWidth required error={!!profileErrors.lastName} helperText={profileErrors.lastName?.message} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField {...registerProfile('email')} label={t('users.email')} type="email" fullWidth required error={!!profileErrors.email} helperText={profileErrors.email?.message} />
                  </Grid>
                </Grid>
                <Button type="submit" variant="contained" disabled={profileSaving} sx={{ mt: 2 }}>
                  {profileSaving ? <CircularProgress size={18} color="inherit" /> : t('common.save')}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* ── Change Password ── */}
          <Card sx={{ mb: 3 }}>
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

          {/* ── Language Preference ── */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" mb={2}>{t('profile.language')}</Typography>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>{t('profile.language')}</InputLabel>
                <Select
                  value={locale}
                  label={t('profile.language')}
                  onChange={e => handleLanguageChange(e.target.value)}
                  disabled={langSaving}
                >
                  {languages.map(l => (
                    <MenuItem key={l.code} value={l.code}>
                      {LANGUAGE_FLAGS[l.code] || '🌐'} {l.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                {t('profile.languageHint')}
              </Typography>
            </CardContent>
          </Card>

          {/* ── Two-Factor Authentication ── */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <SecurityIcon color={totpEnabled ? 'success' : 'action'} />
                <Typography variant="subtitle2">{t('profile.twoFactor')}</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {totpError && <Alert severity="error" sx={{ mb: 2 }}>{totpError}</Alert>}

              {/* Idle — not yet started setup */}
              {totpStep === 'idle' && !totpEnabled && (
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {t('profile.twoFactorSetupHint')}
                  </Typography>
                  <Button variant="contained" onClick={handleSetup2FA} disabled={totpLoading}>
                    {totpLoading ? <CircularProgress size={18} color="inherit" /> : t('profile.setUp2fa')}
                  </Button>
                </Box>
              )}

              {/* Setup — show QR code + manual secret */}
              {totpStep === 'setup' && totpData && (
                <Box>
                  <Typography variant="body2" mb={2}>
                    {t('profile.twoFactorScanHint')}
                  </Typography>

                  <Box display="flex" justifyContent="center" mb={2}>
                    <img
                      src={totpData.qr_image}
                      alt="TOTP QR code"
                      style={{ width: 200, height: 200, border: '1px solid #ccc', borderRadius: 4 }}
                    />
                  </Box>

                  <Typography variant="caption" display="block" color="text.secondary" mb={0.5}>
                    {t('profile.twoFactorSecretKey')}
                  </Typography>
                  <Box
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: 14,
                      bgcolor: 'grey.100',
                      p: 1.5,
                      borderRadius: 1,
                      letterSpacing: 2,
                      wordBreak: 'break-all',
                      mb: 2,
                      border: '1px solid',
                      borderColor: 'grey.300',
                    }}
                  >
                    {totpData.secret}
                  </Box>

                  <Typography variant="body2" mb={1}>
                    {t('profile.twoFactorConfirmHint')}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <TextField
                      label={t('profile.twoFactorCodeLabel')}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
                      size="small"
                      sx={{ width: 160 }}
                    />
                    <Button variant="contained" onClick={handleVerifySetup} disabled={totpLoading || totpCode.length < 6}>
                      {totpLoading ? <CircularProgress size={18} color="inherit" /> : t('profile.twoFactorConfirmButton')}
                    </Button>
                    <Button variant="text" onClick={() => { setTotpStep('idle'); setTotpCode(''); setTotpData(null); }}>
                      {t('common.cancel')}
                    </Button>
                  </Stack>
                </Box>
              )}

              {/* Done — show backup codes once */}
              {totpStep === 'done' && backupCodes && (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>{t('profile.twoFactorEnabledSuccess')}</Alert>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {t('profile.twoFactorBackupWarning')}
                  </Alert>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 1,
                      fontFamily: 'monospace',
                      fontSize: 14,
                      bgcolor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      mb: 2,
                    }}
                  >
                    {backupCodes.map((code, i) => (
                      <span key={i}>{code}</span>
                    ))}
                  </Box>
                  <Button variant="outlined" onClick={() => setTotpStep('idle')}>{t('profile.done')}</Button>
                </Box>
              )}

              {/* 2FA already enabled — show disable option */}
              {totpEnabled && totpStep === 'idle' && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {t('profile.twoFactorIsEnabled')}
                  </Alert>
                  {totpStep !== 'disable' && (
                    <Button variant="outlined" color="error" onClick={() => setTotpStep('disable')}>
                      {t('profile.disable2fa')}
                    </Button>
                  )}
                </Box>
              )}

              {totpEnabled && totpStep === 'disable' && (
                <Box>
                  <Typography variant="body2" mb={1}>
                    {t('profile.disable2faHint')}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <TextField
                      label={t('profile.currentPassword')}
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      size="small"
                    />
                    <Button variant="contained" color="error" onClick={handleDisable2FA} disabled={totpLoading || !disablePassword}>
                      {totpLoading ? <CircularProgress size={18} color="inherit" /> : t('profile.disable2fa')}
                    </Button>
                    <Button variant="text" onClick={() => { setTotpStep('idle'); setDisablePassword(''); }}>
                      {t('common.cancel')}
                    </Button>
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
