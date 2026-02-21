import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, TextField,
  Alert, CircularProgress, Stack, MenuItem, Select, FormControl,
  InputLabel, DialogActions, FormControlLabel, Checkbox,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';

export default function EventForm({ open, onClose, onSaved, event, canEdit = true, canDelete = false, onDeleteRequest }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const isEdit = Boolean(event?.id);

  const schema = useMemo(() => yup.object({
    title: yup.string().required(t('validation.eventTitleRequired')),
  }), [t]);

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      type: 'meeting',
      startDate: '',
      endDate: '',
      description: '',
      location: '',
      isAllDay: false,
    },
  });

  const isAllDay = watch('isAllDay');

  useEffect(() => {
    if (event) {
      reset({
        title: event.title || '',
        type: event.type || 'meeting',
        startDate: event.start ? event.start.slice(0, 16) : (event.startDate ? event.startDate.slice(0, 10) : ''),
        endDate: event.end ? event.end.slice(0, 16) : (event.endDate ? event.endDate.slice(0, 10) : ''),
        description: event.extendedProps?.description || event.description || '',
        location: event.extendedProps?.location || event.location || '',
        isAllDay: event.allDay || event.is_all_day || false,
      });
    } else {
      reset({ title: '', type: 'meeting', startDate: '', endDate: '', description: '', location: '', isAllDay: false });
    }
    setFieldErrors([]);
  }, [event, open]);

  const onSubmit = async (data) => {
    if (!canEdit) return;
    setSaving(true);
    setError('');
    setFieldErrors([]);
    try {
      const payload = {
        title: data.title,
        type: data.type,
        is_all_day: data.isAllDay,
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
              disabled={!canEdit}
            />
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>{t('calendar.eventType')}</InputLabel>
                  <Select {...field} label={t('calendar.eventType')} disabled={!canEdit}>
                    <MenuItem value="meeting">{t('calendar.typeMeeting')}</MenuItem>
                    <MenuItem value="call">{t('calendar.typeCall')}</MenuItem>
                    <MenuItem value="task">{t('calendar.typeTask')}</MenuItem>
                    <MenuItem value="reminder">{t('calendar.typeReminder')}</MenuItem>
                    <MenuItem value="other">{t('calendar.typeOther')}</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="isAllDay"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} disabled={!canEdit} />}
                  label={t('calendar.allDay')}
                />
              )}
            />
            <TextField
              {...register('startDate')}
              label={t('calendar.startDate')}
              type={isAllDay ? 'date' : 'datetime-local'}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={!canEdit}
            />
            <TextField
              {...register('endDate')}
              label={t('calendar.endDate')}
              type={isAllDay ? 'date' : 'datetime-local'}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={!canEdit}
            />
            <TextField {...register('location')} label={t('calendar.location')} fullWidth disabled={!canEdit} />
            <TextField {...register('description')} label={t('common.description')} fullWidth multiline rows={3} disabled={!canEdit} />
          </Stack>
        </DialogContent>
        <DialogActions>
          {isEdit && canDelete && (
            <Button
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onDeleteRequest?.(event.id)}
              sx={{ mr: 'auto' }}
            >
              {t('common.delete')}
            </Button>
          )}
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          {canEdit && (
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={18} color="inherit" /> : t('common.save')}
            </Button>
          )}
        </DialogActions>
      </Box>
    </Dialog>
  );
}
