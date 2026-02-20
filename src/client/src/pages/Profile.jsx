import React, { useState } from 'react';
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

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().min(8, 'Minimum 8 characters').required('New password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('newPassword')], 'Passwords must match').required(),
});

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
      setTotpError(err.response?.data?.message || 'Failed to start 2FA setup.');
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
      setTotpError(err.response?.data?.message || 'Invalid code. Please try again.');
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
      setTotpError(err.response?.data?.message || 'Failed to disable 2FA.');
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
                  ? <Chip icon={<SecurityIcon />} label="2FA enabled" color="success" size="small" />
                  : <Chip icon={<SecurityIcon />} label="2FA disabled" color="default" size="small" />}
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
                <Typography variant="subtitle2">Two-Factor Authentication (2FA)</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {totpError && <Alert severity="error" sx={{ mb: 2 }}>{totpError}</Alert>}

              {/* Idle — not yet started setup */}
              {totpStep === 'idle' && !totpEnabled && (
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Add an extra layer of security. You will need an authenticator app such as
                    Google Authenticator, Authy, or any TOTP-compatible app.
                  </Typography>
                  <Button variant="contained" onClick={handleSetup2FA} disabled={totpLoading}>
                    {totpLoading ? <CircularProgress size={18} color="inherit" /> : 'Set up 2FA'}
                  </Button>
                </Box>
              )}

              {/* Setup — show QR code + manual secret */}
              {totpStep === 'setup' && totpData && (
                <Box>
                  <Typography variant="body2" mb={2}>
                    Scan the QR code below with your authenticator app. If you cannot scan it,
                    enter the secret key manually.
                  </Typography>

                  <Box display="flex" justifyContent="center" mb={2}>
                    <img
                      src={totpData.qr_image}
                      alt="TOTP QR code"
                      style={{ width: 200, height: 200, border: '1px solid #ccc', borderRadius: 4 }}
                    />
                  </Box>

                  <Typography variant="caption" display="block" color="text.secondary" mb={0.5}>
                    Manual entry secret key:
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
                    After scanning, enter the 6-digit code from your app to confirm:
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <TextField
                      label="6-digit code"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
                      size="small"
                      sx={{ width: 160 }}
                    />
                    <Button variant="contained" onClick={handleVerifySetup} disabled={totpLoading || totpCode.length < 6}>
                      {totpLoading ? <CircularProgress size={18} color="inherit" /> : 'Confirm & Enable'}
                    </Button>
                    <Button variant="text" onClick={() => { setTotpStep('idle'); setTotpCode(''); setTotpData(null); }}>
                      Cancel
                    </Button>
                  </Stack>
                </Box>
              )}

              {/* Done — show backup codes once */}
              {totpStep === 'done' && backupCodes && (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>2FA is now enabled on your account.</Alert>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <strong>Save your backup codes now.</strong> They will not be shown again.
                    Each code can be used once if you lose access to your authenticator app.
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
                  <Button variant="outlined" onClick={() => setTotpStep('idle')}>Done</Button>
                </Box>
              )}

              {/* 2FA already enabled — show disable option */}
              {totpEnabled && totpStep === 'idle' && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Two-factor authentication is currently <strong>enabled</strong> on your account.
                  </Alert>
                  {totpStep !== 'disable' && (
                    <Button variant="outlined" color="error" onClick={() => setTotpStep('disable')}>
                      Disable 2FA
                    </Button>
                  )}
                </Box>
              )}

              {totpEnabled && totpStep === 'disable' && (
                <Box>
                  <Typography variant="body2" mb={1}>
                    Enter your current password to disable two-factor authentication:
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <TextField
                      label="Current password"
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      size="small"
                    />
                    <Button variant="contained" color="error" onClick={handleDisable2FA} disabled={totpLoading || !disablePassword}>
                      {totpLoading ? <CircularProgress size={18} color="inherit" /> : 'Disable 2FA'}
                    </Button>
                    <Button variant="text" onClick={() => { setTotpStep('idle'); setDisablePassword(''); }}>
                      Cancel
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
