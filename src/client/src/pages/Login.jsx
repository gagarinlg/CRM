import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, CircularProgress, Divider,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../store/AuthContext.jsx';
import { useTranslation } from '../i18n/I18nContext.jsx';

export default function Login() {
  const { login, verifyTotp } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // TOTP step state
  const [totpPending, setTotpPending] = useState(false);
  const [preAuthToken, setPreAuthToken] = useState('');

  const credSchema = useMemo(() => yup.object({
    email: yup.string().required(t('validation.identifierRequired')),
    password: yup.string().required(t('validation.passwordRequired')),
  }), [t]);

  const totpSchema = useMemo(() => yup.object({
    totp_token: yup.string().required(t('validation.totpRequired')),
  }), [t]);

  const credForm = useForm({ resolver: yupResolver(credSchema) });
  const totpForm = useForm({ resolver: yupResolver(totpSchema) });

  const onCredSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result?.requiresTotp) {
        setPreAuthToken(result.preAuthToken);
        setTotpPending(true);
      } else if (result?.mustChangePassword || result?.force_password_change) {
        navigate('/change-password');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onTotpSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      const user = await verifyTotp(preAuthToken, data.totp_token);
      if (user?.force_password_change) {
        navigate('/change-password');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || t('auth.totpInvalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      p={2}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <TrendingUpIcon color="primary" sx={{ fontSize: 36 }} />
              <Typography variant="h4" fontWeight={700} color="primary">CRM</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {totpPending ? t('auth.totpTitle') : t('auth.signInTitle')}
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {!totpPending ? (
            /* ── Step 1: email + password ── */
            <Box component="form" onSubmit={credForm.handleSubmit(onCredSubmit)} noValidate>
              <TextField
                {...credForm.register('email')}
                label={t('auth.emailOrUsername')}
                fullWidth
                margin="normal"
                error={!!credForm.formState.errors.email}
                helperText={credForm.formState.errors.email?.message}
                autoComplete="username"
                autoFocus
              />
              <TextField
                {...credForm.register('password')}
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                fullWidth
                margin="normal"
                error={!!credForm.formState.errors.password}
                helperText={credForm.formState.errors.password?.message}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(s => !s)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 1 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : t('auth.signIn')}
              </Button>
            </Box>
          ) : (
            /* ── Step 2: TOTP code ── */
            <Box component="form" onSubmit={totpForm.handleSubmit(onTotpSubmit)}>
              <Box display="flex" justifyContent="center" mb={2}>
                <LockIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              </Box>
              <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
                {t('auth.totpCodeHint')}
              </Typography>
              <TextField
                {...totpForm.register('totp_token')}
                label={t('auth.totpCode')}
                fullWidth
                margin="normal"
                inputProps={{ maxLength: 20, inputMode: 'numeric', pattern: '[0-9A-Z-]*' }}
                error={!!totpForm.formState.errors.totp_token}
                helperText={totpForm.formState.errors.totp_token?.message}
                autoFocus
                autoComplete="one-time-code"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 1 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : t('auth.verify')}
              </Button>
              <Divider sx={{ my: 1 }} />
              <Button
                fullWidth
                variant="text"
                size="small"
                onClick={() => { setTotpPending(false); setError(''); setPreAuthToken(''); }}
              >
                {t('auth.backToLogin')}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
