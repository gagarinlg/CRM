import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../store/AuthContext.jsx';
import { useTranslation } from '../i18n/I18nContext.jsx';

export default function ChangePassword() {
  const { changePassword, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const schema = useMemo(() => yup.object({
    currentPassword: yup.string().required(t('validation.currentPasswordRequired')),
    newPassword: yup.string().min(8, t('auth.minPassword')).required(t('validation.newPasswordRequired')),
    confirmPassword: yup.string()
      .oneOf([yup.ref('newPassword')], t('auth.passwordsMustMatch'))
      .required(t('validation.confirmPasswordRequired')),
  }), [t]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.passwordChangeFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" bgcolor="background.default" p={2}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={600} mb={1}>{t('profile.changePassword')}</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {t('auth.mustChangePassword')}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('currentPassword')}
              label={t('profile.currentPassword')}
              type={showCurrent ? 'text' : 'password'}
              fullWidth
              margin="normal"
              error={!!errors.currentPassword}
              helperText={errors.currentPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowCurrent(s => !s)} edge="end">
                      {showCurrent ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              {...register('newPassword')}
              label={t('profile.newPassword')}
              type={showNew ? 'text' : 'password'}
              fullWidth
              margin="normal"
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNew(s => !s)} edge="end">
                      {showNew ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              {...register('confirmPassword')}
              label={t('profile.confirmPassword')}
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 3, mb: 1 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : t('profile.changePassword')}
            </Button>
            <Button fullWidth variant="text" onClick={logout}>{t('auth.logout')}</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
