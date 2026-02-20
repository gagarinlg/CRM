import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, IconButton, Chip,
  Tooltip, Alert, Divider, Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import NoteForm from '../../pages/Notes/NoteForm.jsx';
import dayjs from 'dayjs';

const NOTE_COLORS = {
  general: 'default', call: 'primary', meeting: 'secondary',
  email: 'info', task: 'warning',
};

export default function NotesList({ entityType, entityId }) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const endpointMap = {
        company: `/companies/${entityId}/notes`,
        contact: `/contacts/${entityId}/notes`,
        project: `/projects/${entityId}/notes`,
      };
      const endpoint = endpointMap[entityType]
        || `/notes?entity_type=${entityType}&entity_id=${entityId}`;
      const res = await api.get(endpoint);
      const data = res.data.data || res.data;
      setNotes(Array.isArray(data) ? data : []);
    } catch {
      setError(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleDelete = async () => {
    try {
      await api.delete(`/notes/${deleteId}`);
      setDeleteId(null);
      fetchNotes();
    } catch {
      setError(t('errors.deleteFailed'));
      setDeleteId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2">{t('notes.title')} ({notes.length})</Typography>
        <Tooltip title={t('notes.new')}>
          <IconButton size="small" color="primary" onClick={() => { setShowForm(s => !s); setEditNote(null); }}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Collapse in={showForm && !editNote}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <NoteForm
              entityType={entityType}
              entityId={entityId}
              onSaved={() => { setShowForm(false); fetchNotes(); }}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      </Collapse>

      {notes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">{t('common.noResults')}</Typography>
      ) : (
        notes.map((note, i) => (
          <React.Fragment key={note.id}>
            <Card sx={{ mb: 1 }}>
              <CardContent sx={{ py: 1.5 }}>
                {editNote?.id === note.id ? (
                  <NoteForm
                    entityType={entityType}
                    entityId={entityId}
                    note={note}
                    onSaved={() => { setEditNote(null); fetchNotes(); }}
                    onCancel={() => setEditNote(null)}
                  />
                ) : (
                  <>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Chip label={note.type || 'general'} size="small" color={NOTE_COLORS[note.type] || 'default'} />
                        <Typography variant="caption" color="text.secondary">
                          {note.created_by_name || note.authorName || note.author?.firstName} • {dayjs(note.created_at || note.createdAt).format('DD MMM YYYY HH:mm')}
                        </Typography>
                      </Box>
                      <Box>
                        <Tooltip title={t('common.edit')}>
                          <IconButton size="small" onClick={() => { setEditNote(note); setShowForm(false); }}>
                            <EditIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <IconButton size="small" color="error" onClick={() => setDeleteId(note.id)}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{note.content}</Typography>
                  </>
                )}
              </CardContent>
            </Card>
            {i < notes.length - 1 && <Divider />}
          </React.Fragment>
        ))
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t('notes.deleteTitle')}
        message={t('notes.deleteMessage')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
