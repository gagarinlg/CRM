import React, { useState } from 'react';
import {
  Box, TextField, Button, CircularProgress, Alert,
  MenuItem, Select, FormControl, InputLabel, FormControlLabel, Checkbox,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';

export default function NoteForm({ entityType, entityId, note, onSaved, onCancel }) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: {
      content: note?.content || '',
      type: note?.type || 'general',
      is_private: note?.is_private || false,
    },
  });

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        content: data.content,
        type: data.type,
        is_private: data.is_private,
        entity_type: entityType,
        entity_id: entityId,
      };
      if (note?.id) {
        await api.put(`/notes/${note.id}`, payload);
      } else {
        await api.post('/notes', payload);
      }
      reset();
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <FormControl size="small" sx={{ mb: 1, minWidth: 140 }}>
            <InputLabel>{t('notes.type')}</InputLabel>
            <Select {...field} label={t('notes.type')}>
              <MenuItem value="general">{t('notes.typeGeneral')}</MenuItem>
              <MenuItem value="call">{t('notes.typeCall')}</MenuItem>
              <MenuItem value="meeting">{t('notes.typeMeeting')}</MenuItem>
              <MenuItem value="email">{t('notes.typeEmail')}</MenuItem>
              <MenuItem value="task">{t('notes.typeTask')}</MenuItem>
            </Select>
          </FormControl>
        )}
      />
      <Controller
        name="is_private"
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={<Checkbox {...field} checked={field.value} size="small" />}
            label={t('notes.private')}
          />
        )}
      />
      <TextField
        {...register('content', { required: true })}
        label={t('notes.content')}
        fullWidth
        multiline
        rows={3}
        error={!!errors.content}
        helperText={errors.content ? t('errors.required') : ''}
        sx={{ mb: 1 }}
      />
      <Box display="flex" gap={1} justifyContent="flex-end">
        {onCancel && <Button size="small" onClick={onCancel}>{t('common.cancel')}</Button>}
        <Button type="submit" variant="contained" size="small" disabled={saving}>
          {saving ? <CircularProgress size={16} color="inherit" /> : t('common.save')}
        </Button>
      </Box>
    </Box>
  );
}
