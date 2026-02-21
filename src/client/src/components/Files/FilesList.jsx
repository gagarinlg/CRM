import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, IconButton,
  Tooltip, Alert, LinearProgress, Chip, Stack,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import dayjs from 'dayjs';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

export default function FilesList({ entityType, entityId }) {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const fileInputRef = useRef(null);

  const endpoint = `/attachments/${entityType}/${entityId}`;

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoint);
      const data = res.data.data || res.data;
      setFiles(Array.isArray(data) ? data : []);
    } catch {
      setError(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchFiles();
    } catch (err) {
      setError(err.response?.data?.message || t('errors.saveFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = (file) => {
    const base = (api.defaults.baseURL || '/api/v1').replace(/\/$/, '');
    window.open(`${base}${endpoint}/${file.id}/download`, '_blank');
  };

  const handleDelete = async () => {
    try {
      await api.delete(`${endpoint}/${deleteId}`);
      setDeleteId(null);
      fetchFiles();
    } catch {
      setError(t('errors.deleteFailed'));
      setDeleteId(null);
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          {t('files.title', 'Files')} ({files.length})
        </Typography>
        <Tooltip title={t('files.upload', 'Upload File')}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <UploadFileIcon />
          </IconButton>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </Box>

      {uploading && <LinearProgress sx={{ mb: 2 }} />}
      {loading && !uploading && <LinearProgress sx={{ mb: 2 }} />}

      {files.length === 0 && !loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          {t('files.noFiles', 'No files attached yet.')}
        </Typography>
      ) : (
        files.map(file => (
          <Card key={file.id} sx={{ mb: 1, '&:hover': { boxShadow: 2 } }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box display="flex" alignItems="center" gap={1}>
                <AttachFileIcon sx={{ color: 'text.secondary', fontSize: 20, flexShrink: 0 }} />
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={500} noWrap title={file.original_name}>
                    {file.original_name}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {formatBytes(file.size)}
                    </Typography>
                    {file.mime_type && (
                      <Chip label={file.mime_type.split('/')[1]} size="small" sx={{ height: 16, fontSize: 10 }} />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {file.uploaded_by_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(file.created_at).format('DD MMM YYYY')}
                    </Typography>
                  </Stack>
                </Box>
                <Box display="flex" gap={0.5} flexShrink={0}>
                  <Tooltip title={t('files.download', 'Download')}>
                    <IconButton size="small" onClick={() => handleDownload(file)}>
                      <DownloadIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(file.id)}>
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t('files.deleteTitle', 'Delete File')}
        message={t('files.deleteMessage', 'Are you sure you want to delete this file? This cannot be undone.')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
