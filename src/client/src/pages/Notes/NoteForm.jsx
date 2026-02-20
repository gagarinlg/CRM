import React, { useState } from 'react';
import {
  Box, TextField, Button, CircularProgress, Alert,
  MenuItem, Select, FormControl, InputLabel,
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
    },
  });

  const onSubmit = async (data) => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        content: data.content,
        type: data.type,
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
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="call">Call</MenuItem>
              <MenuItem value="meeting">Meeting</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="task">Task</MenuItem>
            </Select>
          </FormControl>
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
