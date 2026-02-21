import React, { useState, useEffect } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, TextField,
  Alert, CircularProgress, Stack, MenuItem, Select, FormControl,
  InputLabel, DialogActions,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';

const eventSchema = yup.object({
  title: yup.string().required('Event title is required'),
});

export default function EventForm({ open, onClose, onSaved, event }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const isEdit = Boolean(event?.id);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(eventSchema),
    defaultValues: {
      title: '',
      type: 'meeting',
      startDate: '',
      endDate: '',
      description: '',
      location: '',
    },
  });

  useEffect(() => {
    if (event) {
      reset({
        title: event.title || '',
        type: event.type || 'meeting',
        startDate: event.start ? event.start.slice(0, 16) : '',
        endDate: event.end ? event.end.slice(0, 16) : '',
        description: event.extendedProps?.description || event.description || '',
        location: event.extendedProps?.location || event.location || '',
      });
    } else {
      reset({ title: '', type: 'meeting', startDate: '', endDate: '', description: '', location: '' });
    }
    setFieldErrors([]);
  }, [event, open]);

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    setFieldErrors([]);
    try {
      const payload = {
        title: data.title,
        type: data.type,
        start_datetime: data.startDate ? new Date(data.startDate).toISOString() : null,
        end_datetime: data.endDate ? new Date(data.endDate).toISOString() : null,
        description: data.description,
        location: data.location,
      };
      if (isEdit) await api.put(`/calendar/${event.id}`, payload);
      else await api.post('/calendar', payload);
      onSaved?.();
      onClose();
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? t('calendar.editEvent') : t('calendar.newEvent')}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {fieldErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {fieldErrors.map((e, i) => <li key={i}>{e.message}</li>)}
              </ul>
            </Alert>
          )}
          <Stack spacing={2}>
            <TextField
              {...register('title')}
              label={t('calendar.eventTitle')}
              fullWidth
              required
              error={!!errors.title}
              helperText={errors.title?.message}
            />
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>{t('calendar.eventType')}</InputLabel>
                  <Select {...field} label={t('calendar.eventType')}>
                    <MenuItem value="meeting">{t('calendar.typeMeeting')}</MenuItem>
                    <MenuItem value="call">{t('calendar.typeCall')}</MenuItem>
                    <MenuItem value="task">{t('calendar.typeTask')}</MenuItem>
                    <MenuItem value="reminder">{t('calendar.typeReminder')}</MenuItem>
                    <MenuItem value="other">{t('calendar.typeOther')}</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <TextField
              {...register('startDate')}
              label={t('calendar.startDate')}
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              {...register('endDate')}
              label={t('calendar.endDate')}
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField {...register('location')} label={t('calendar.location')} fullWidth />
            <TextField {...register('description')} label={t('common.description')} fullWidth multiline rows={3} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : t('common.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
