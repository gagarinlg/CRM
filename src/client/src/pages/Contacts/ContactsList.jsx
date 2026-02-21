import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Paper, IconButton, Chip, Alert, Tooltip,
  Stack, MenuItem, Select, FormControl, InputLabel, Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import useDebounce from '../../hooks/useDebounce.js';

export default function ContactsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const debouncedSearch = useDebounce(search, 400);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: rowsPerPage };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/contacts', { params });
      const data = res.data.data || res.data;
      setContacts(Array.isArray(data) ? data : data.items || data.contacts || []);
      setTotal(res.data.total || res.data.pagination?.total || (Array.isArray(data) ? data.length : 0));
    } catch {
      setError(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, statusFilter]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleDelete = async () => {
    try {
      await api.delete(`/contacts/${deleteId}`);
      setDeleteId(null);
      fetchContacts();
    } catch {
      setError(t('errors.deleteFailed'));
      setDeleteId(null);
    }
  };

  const initials = (c) => `${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}`.toUpperCase();

  return (
    <Box>
      <PageHeader
        title={t('contacts.title')}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/contacts/new')}>
            {t('contacts.new')}
          </Button>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <SearchBar value={search} onChange={setSearch} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t('contacts.status')}</InputLabel>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} label={t('contacts.status')}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('contacts.name')}</TableCell>
                <TableCell>{t('contacts.company')}</TableCell>
                <TableCell>{t('contacts.jobTitle')}</TableCell>
                <TableCell>{t('tags.title', 'Tags')}</TableCell>
                <TableCell>{t('contacts.email')}</TableCell>
                <TableCell>{t('contacts.phone')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7}><LoadingSpinner /></TableCell></TableRow>
              ) : contacts.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">{t('common.noResults')}</TableCell></TableRow>
              ) : contacts.map(c => (
                <TableRow key={c.id} hover onClick={() => navigate(`/contacts/${c.id}`)} sx={{ cursor: 'pointer' }}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.light' }}>{initials(c)}</Avatar>
                      {c.first_name || c.firstName} {c.last_name || c.lastName}
                    </Box>
                  </TableCell>
                  <TableCell>{c.companyName || c.company?.name}</TableCell>
                  <TableCell>{c.jobTitle}</TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {(c.tags || []).map(tag => (
                        <Chip key={tag.id} label={tag.name} size="small" sx={{ bgcolor: tag.color || '#6b7280', color: '#fff', fontSize: 11, height: 20 }} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.primary_phone || c.phone || '—'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('common.view')}>
                      <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/contacts/${c.id}`); }}><VisibilityIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/contacts/${c.id}/edit`); }}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton size="small" color="error" onClick={e => { e.stopPropagation(); setDeleteId(c.id); }}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </Paper>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t('contacts.deleteTitle')}
        message={t('contacts.deleteMessage')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
