import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, IconButton, Chip,
  Tooltip, Alert, Divider, Collapse, Avatar, Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import PeopleIcon from '@mui/icons-material/People';
import TaskIcon from '@mui/icons-material/Task';
import NoteIcon from '@mui/icons-material/Note';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import { useAuth } from '../../store/AuthContext.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import NoteForm from '../../pages/Notes/NoteForm.jsx';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const NOTE_COLORS = {
  general: 'default', call: 'primary', meeting: 'secondary',
  email: 'info', task: 'warning',
};

const NOTE_ICONS = {
  general: <NoteIcon sx={{ fontSize: 14 }} />,
  call: <PhoneIcon sx={{ fontSize: 14 }} />,
  meeting: <PeopleIcon sx={{ fontSize: 14 }} />,
  email: <EmailIcon sx={{ fontSize: 14 }} />,
  task: <TaskIcon sx={{ fontSize: 14 }} />,
};

function authorInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function NotesList({ entityType, entityId }) {
  const { t } = useTranslation();
  const { user, hasPermission, isAdminUser } = useAuth();
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
        lead: `/leads/${entityId}/notes`,
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
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          {t('notes.title')} ({notes.length})
        </Typography>
        {hasPermission('notes.write') && (
          <Tooltip title={t('notes.addNote')}>
            <IconButton size="small" color="primary" onClick={() => { setShowForm(s => !s); setEditNote(null); }}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Collapse in={showForm && !editNote}>
        <Card sx={{ mb: 2, border: '1px dashed', borderColor: 'primary.main' }}>
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

      {notes.length === 0 && !showForm ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          {t('notes.noNotes')}
        </Typography>
      ) : (
        notes.map((note, i) => {
          const author = note.created_by_name || note.authorName || '';
          const type = note.type || 'general';
          const createdAt = note.created_at || note.createdAt;
          const updatedAt = note.updated_at || note.updatedAt;
          const wasEdited = updatedAt && updatedAt !== createdAt;

          return (
            <React.Fragment key={note.id}>
              <Card sx={{ mb: 1.5, '&:hover': { boxShadow: 3 } }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
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
                      {/* Header row */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: 'primary.main' }}>
                            {authorInitials(author)}
                          </Avatar>
                          <Box>
                            <Typography variant="caption" fontWeight={600} display="block" lineHeight={1.2}>
                              {author || t('common.unknown', 'Unknown')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.2}>
                              {createdAt ? dayjs(createdAt).format('DD MMM YYYY, HH:mm') : ''}
                              {wasEdited && (
                                <span style={{ marginLeft: 4, fontStyle: 'italic' }}>
                                  ({t('common.edited', 'edited')} {dayjs(updatedAt).fromNow()})
                                </span>
                              )}
                            </Typography>
                          </Box>
                          <Chip
                            icon={NOTE_ICONS[type]}
                            label={t(`notes.type${type.charAt(0).toUpperCase() + type.slice(1)}`, type)}
                            size="small"
                            color={NOTE_COLORS[type] || 'default'}
                            sx={{ height: 20, '& .MuiChip-label': { fontSize: 10, px: 0.8 } }}
                          />
                        </Stack>
                        <Box display="flex" gap={0.5}>
                          {(hasPermission('notes.write') && (note.created_by === user?.id || isAdminUser)) && (
                            <Tooltip title={t('common.edit')}>
                              <IconButton size="small" onClick={() => { setEditNote(note); setShowForm(false); }}>
                                <EditIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {(hasPermission('notes.delete') && (note.created_by === user?.id || isAdminUser)) && (
                            <Tooltip title={t('common.delete')}>
                              <IconButton size="small" color="error" onClick={() => setDeleteId(note.id)}>
                                <DeleteIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                      {/* Content */}
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', pl: 4.5 }}>
                        {note.content}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
              {i < notes.length - 1 && <Divider sx={{ mb: 1.5 }} />}
            </React.Fragment>
          );
        })
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
