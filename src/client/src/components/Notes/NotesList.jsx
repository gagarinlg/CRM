import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, IconButton, Chip,
  Tooltip, Alert, Divider, Collapse, Avatar, Stack,
  TextField, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import LockIcon from '@mui/icons-material/Lock';
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
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const canWrite = hasPermission('notes.write');
  const canDelete = hasPermission('notes.delete');
  const canEditNote = (note) => canWrite && (note.created_by === user?.id || isAdminUser);
  const canDeleteNote = (note) => canDelete && (note.created_by === user?.id || isAdminUser);

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

  const handleTogglePin = async (note) => {
    try {
      await api.put(`/notes/${note.id}`, { is_pinned: !note.is_pinned });
      fetchNotes();
    } catch {
      setError(t('errors.saveFailed'));
    }
  };

  const visibleNotes = notes.filter(note => {
    if (typeFilter && note.type !== typeFilter) return false;
    if (search && !note.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle2" color="text.secondary">
          {t('notes.title')} ({notes.length})
        </Typography>
        {canWrite && (
          <Tooltip title={t('notes.addNote')}>
            <IconButton size="small" color="primary" onClick={() => { setShowForm(s => !s); setEditNote(null); }}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Search and type filter */}
      <Stack direction="row" spacing={1} mb={1.5}>
        <TextField
          size="small"
          placeholder={t('notes.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t('notes.filterType')}</InputLabel>
          <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} label={t('notes.filterType')}>
            <MenuItem value="">{t('notes.allTypes')}</MenuItem>
            <MenuItem value="general">{t('notes.typeGeneral')}</MenuItem>
            <MenuItem value="call">{t('notes.typeCall')}</MenuItem>
            <MenuItem value="meeting">{t('notes.typeMeeting')}</MenuItem>
            <MenuItem value="email">{t('notes.typeEmail')}</MenuItem>
            <MenuItem value="task">{t('notes.typeTask')}</MenuItem>
          </Select>
        </FormControl>
      </Stack>

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

      {visibleNotes.length === 0 && !showForm ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          {t('notes.noNotes')}
        </Typography>
      ) : (
        visibleNotes.map((note, i) => {
          const author = note.created_by_name || note.authorName || '';
          const type = note.type || 'general';
          const createdAt = note.created_at || note.createdAt;
          const updatedAt = note.updated_at || note.updatedAt;
          const wasEdited = updatedAt && updatedAt !== createdAt;

          return (
            <React.Fragment key={note.id}>
              <Card sx={{
                mb: 1.5,
                '&:hover': { boxShadow: 3 },
                ...(note.is_pinned ? { borderLeft: '3px solid', borderColor: 'warning.main' } : {}),
                ...(note.is_private ? { bgcolor: 'action.hover' } : {}),
              }}>
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
                          {note.is_private && (
                            <Tooltip title={t('notes.privateHint')}>
                              <LockIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            </Tooltip>
                          )}
                        </Stack>
                        <Box display="flex" gap={0.5}>
                          {canEditNote(note) && (
                            <Tooltip title={note.is_pinned ? t('notes.unpinNote') : t('notes.pinNote')}>
                              <IconButton size="small" onClick={() => handleTogglePin(note)} color={note.is_pinned ? 'warning' : 'default'}>
                                {note.is_pinned ? <PushPinIcon sx={{ fontSize: 14 }} /> : <PushPinOutlinedIcon sx={{ fontSize: 14 }} />}
                              </IconButton>
                            </Tooltip>
                          )}
                          {canEditNote(note) && (
                            <Tooltip title={t('common.edit')}>
                              <IconButton size="small" onClick={() => { setEditNote(note); setShowForm(false); }}>
                                <EditIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canDeleteNote(note) && (
                            <Tooltip title={t('common.delete')}>
                              <IconButton size="small" color="error" onClick={() => setDeleteId(note.id)}>
                                <DeleteIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', pl: 4.5 }}>
                        {note.content}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
              {i < visibleNotes.length - 1 && <Divider sx={{ mb: 1.5 }} />}
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
