import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Chip, Typography, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, List, ListItemButton, ListItemText, CircularProgress, Alert,
  Autocomplete,
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';

export default function EntityTags({ entityType, entityId }) {
  const { t } = useTranslation();
  const [tags, setTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6b7280');
  const [selectedTag, setSelectedTag] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [removeError, setRemoveError] = useState('');

  const loadTags = useCallback(async () => {
    try {
      const res = await api.get(`/tags/${entityType}/${entityId}`);
      setTags(res.data.data || res.data || []);
    } catch {
      // tags are secondary — show nothing rather than blocking the page
    }
  }, [entityType, entityId]);

  const loadAllTags = useCallback(async () => {
    try {
      const res = await api.get('/tags');
      setAllTags(res.data.data || res.data || []);
    } catch {
      // silently ignore load failures
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleOpenDialog = () => {
    setError('');
    setNewTagName('');
    setNewTagColor('#6b7280');
    setSelectedTag(null);
    loadAllTags();
    setDialogOpen(true);
  };

  const handleRemoveTag = async (tagId) => {
    setRemoveError('');
    try {
      await api.delete(`/tags/${entityType}/${entityId}/${tagId}`);
      setTags(prev => prev.filter(t => t.id !== tagId));
    } catch {
      setRemoveError(t('errors.deleteFailed'));
    }
  };

  const handleAddExistingTag = async () => {
    if (!selectedTag) return;
    setSaving(true);
    setError('');
    try {
      await api.post(`/tags/${entityType}/${entityId}`, { tag_id: selectedTag.id });
      setDialogOpen(false);
      await loadTags();
    } catch (err) {
      setError(err.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newTagName.trim()) return;
    setSaving(true);
    setError('');
    try {
      const createRes = await api.post('/tags', { name: newTagName.trim(), color: newTagColor });
      const newTag = createRes.data.data || createRes.data;
      await api.post(`/tags/${entityType}/${entityId}`, { tag_id: newTag.id });
      setDialogOpen(false);
      await loadTags();
    } catch (err) {
      setError(err.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const assignableTags = allTags.filter(t => !tags.some(et => et.id === t.id));

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
        <LocalOfferIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
        {tags.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            {t('tags.none', 'No tags')}
          </Typography>
        )}
        {tags.map(tag => (
          <Chip
            key={tag.id}
            label={tag.name}
            size="small"
            onDelete={() => handleRemoveTag(tag.id)}
            sx={{
              bgcolor: tag.color || '#6b7280',
              color: '#fff',
              '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)' },
              fontSize: 11,
            }}
          />
        ))}
        <Tooltip title={t('tags.addTag', 'Add tag')}>
          <IconButton size="small" onClick={handleOpenDialog} aria-label={t('tags.addTag', 'Add tag')}>
            <AddIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
      {removeError && (
        <Typography variant="caption" color="error" display="block" mt={0.5}>{removeError}</Typography>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('tags.addTag', 'Add Tag')}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {assignableTags.length > 0 && (
            <Box mb={3}>
              <Typography variant="body2" fontWeight={500} mb={1}>
                {t('tags.selectExisting', 'Select existing tag')}
              </Typography>
              <Autocomplete
                options={assignableTags}
                getOptionLabel={opt => opt.name}
                value={selectedTag}
                onChange={(_, val) => setSelectedTag(val)}
                renderInput={params => (
                  <TextField {...params} size="small" placeholder={t('tags.searchTags', 'Search tags…')} />
                )}
                renderOption={(props, opt) => (
                  <li {...props} key={opt.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: opt.color || '#6b7280',
                          flexShrink: 0,
                        }}
                      />
                      {opt.name}
                    </Box>
                  </li>
                )}
              />
              {selectedTag && (
                <Button
                  variant="contained"
                  size="small"
                  sx={{ mt: 1 }}
                  disabled={saving}
                  onClick={handleAddExistingTag}
                >
                  {saving ? <CircularProgress size={16} color="inherit" /> : t('tags.addSelected', 'Add selected tag')}
                </Button>
              )}
            </Box>
          )}

          <Typography variant="body2" fontWeight={500} mb={1}>
            {t('tags.createNew', 'Create new tag')}
          </Typography>
          <Box display="flex" gap={1} alignItems="center">
            <TextField
              size="small"
              label={t('tags.name', 'Tag name')}
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              fullWidth
            />
            <Tooltip title={t('tags.color', 'Tag color')}>
              <Box
                component="input"
                type="color"
                value={newTagColor}
                onChange={e => setNewTagColor(e.target.value)}
                sx={{
                  width: 36,
                  height: 36,
                  border: 'none',
                  borderRadius: 1,
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          {newTagName.trim() && (
            <Button variant="contained" disabled={saving} onClick={handleCreateAndAdd}>
              {saving ? <CircularProgress size={16} color="inherit" /> : t('tags.create', 'Create & add')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
