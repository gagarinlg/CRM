import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, CircularProgress, Alert, Box, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import api from '../../services/api.js';

// Extension → preview strategy
const TEXT_EXTS = new Set(['txt', 'yaml', 'yml', 'xml', 'html', 'htm', 'json', 'md', 'markdown', 'log', 'sh', 'sql', 'env', 'ini', 'toml', 'cfg', 'conf']);
const CSV_EXTS = new Set(['csv', 'tsv']);
const DOCX_EXTS = new Set(['docx', 'doc']);
const SHEET_EXTS = new Set(['xlsx', 'xls', 'ods', 'fods']);
const IMPRESS_EXTS = new Set(['pptx', 'ppt', 'odp']);
const WRITER_EXTS = new Set(['odt', 'fodt', 'rtf']);
const IMAGE_TYPES = ['image/'];
const PDF_TYPE = 'application/pdf';

function getExt(filename) {
  return (filename || '').split('.').pop().toLowerCase();
}

function getStrategy(file) {
  const ext = getExt(file.original_name);
  const mime = (file.mime_type || '').toLowerCase();
  if (IMAGE_TYPES.some(t => mime.startsWith(t))) return 'image';
  if (mime === PDF_TYPE) return 'pdf';
  if (TEXT_EXTS.has(ext) || mime.startsWith('text/')) return 'text';
  if (CSV_EXTS.has(ext)) return 'csv';
  if (DOCX_EXTS.has(ext)) return 'docx';
  if (SHEET_EXTS.has(ext)) return 'sheet';
  if (IMPRESS_EXTS.has(ext)) return 'none';
  if (WRITER_EXTS.has(ext)) return 'none';
  return 'none';
}

function PreviewContent({ file, onDownload }) {
  const [state, setState] = useState({ loading: true, error: null, content: null, blobUrl: null });
  const strategy = getStrategy(file);
  const endpoint = `/attachments/${file.entity_type || 'lead'}/${file.entity_id || ''}`; // not needed for direct id
  const previewUrl = `${(api.defaults.baseURL || '/api/v1').replace(/\/$/, '')}/attachments/${file.entity_type || 'project'}/${file.entity_id || 'x'}/${file.id}/preview`;

  const load = useCallback(async () => {
    setState({ loading: true, error: null, content: null, blobUrl: null });
    try {
      if (strategy === 'none') {
        setState({ loading: false, error: null, content: null, blobUrl: null });
        return;
      }
      if (strategy === 'image' || strategy === 'pdf') {
        const res = await api.get(
          `/attachments/${file.entity_type}/${file.entity_id}/${file.id}/preview`,
          { responseType: 'blob' }
        );
        const blobUrl = URL.createObjectURL(res.data);
        setState({ loading: false, error: null, content: null, blobUrl });
        return;
      }
      if (strategy === 'docx') {
        const res = await api.get(
          `/attachments/${file.entity_type}/${file.entity_id}/${file.id}/preview`,
          { responseType: 'arraybuffer' }
        );
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.convertToHtml({ arrayBuffer: res.data });
        setState({ loading: false, error: null, content: { type: 'html', value: result.value }, blobUrl: null });
        return;
      }
      if (strategy === 'csv') {
        const res = await api.get(
          `/attachments/${file.entity_type}/${file.entity_id}/${file.id}/preview`,
          { responseType: 'text' }
        );
        const Papa = (await import('papaparse')).default;
        const parsed = Papa.parse(res.data.trim(), { header: true, skipEmptyLines: true });
        setState({ loading: false, error: null, content: { type: 'csv', rows: parsed.data, fields: parsed.meta.fields }, blobUrl: null });
        return;
      }
      // text
      const res = await api.get(
        `/attachments/${file.entity_type}/${file.entity_id}/${file.id}/preview`,
        { responseType: 'text' }
      );
      setState({ loading: false, error: null, content: { type: 'text', value: res.data }, blobUrl: null });
    } catch (err) {
      setState({ loading: false, error: err.message || 'Failed to load preview', content: null, blobUrl: null });
    }
  }, [file, strategy]);

  useEffect(() => {
    load();
    return () => {
      if (state.blobUrl) URL.revokeObjectURL(state.blobUrl);
    };
  }, [load]);

  if (state.loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (state.error) {
    return <Alert severity="error">{state.error}</Alert>;
  }

  if (strategy === 'none' || (!state.blobUrl && !state.content)) {
    return (
      <Box textAlign="center" py={6}>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Preview not available for this file type.
        </Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={onDownload}>
          Download to view
        </Button>
      </Box>
    );
  }

  if (strategy === 'image') {
    return (
      <Box display="flex" justifyContent="center" sx={{ maxHeight: '70vh', overflow: 'auto' }}>
        <img src={state.blobUrl} alt={file.original_name} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
      </Box>
    );
  }

  if (strategy === 'pdf') {
    return (
      <Box sx={{ height: '70vh' }}>
        <iframe src={state.blobUrl} title={file.original_name} width="100%" height="100%" style={{ border: 'none' }} />
      </Box>
    );
  }

  if (state.content?.type === 'html') {
    // mammoth output is safe (converts DOCX structure, no external resources)
    return (
      <Box
        sx={{ maxHeight: '70vh', overflow: 'auto', p: 2, fontFamily: 'serif', lineHeight: 1.7, '& table': { borderCollapse: 'collapse', width: '100%' }, '& td, & th': { border: '1px solid #ccc', p: '4px 8px' } }}
        dangerouslySetInnerHTML={{ __html: state.content.value }}
      />
    );
  }

  if (state.content?.type === 'csv') {
    const { rows, fields } = state.content;
    return (
      <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {(fields || []).map(f => <TableCell key={f}>{f}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(0, 500).map((row, i) => (
              <TableRow key={i}>
                {(fields || []).map(f => <TableCell key={f}>{row[f]}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length > 500 && <Typography variant="caption" sx={{ p: 1, display: 'block' }}>Showing first 500 rows of {rows.length}</Typography>}
      </TableContainer>
    );
  }

  // text / sheet fallback
  return (
    <Box
      component="pre"
      sx={{
        maxHeight: '70vh', overflow: 'auto', fontFamily: 'monospace', fontSize: 12,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word', m: 0, p: 2,
        background: 'rgba(0,0,0,0.03)', borderRadius: 1,
      }}
    >
      {state.content?.value}
    </Box>
  );
}

export default function FilePreviewDialog({ open, file, onClose, onDownload }) {
  if (!file) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        <Typography variant="subtitle1" noWrap>{file.original_name}</Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <PreviewContent file={file} onDownload={onDownload} />
      </DialogContent>
      <DialogActions>
        <Button startIcon={<DownloadIcon />} onClick={onDownload}>
          Download
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
