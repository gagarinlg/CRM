import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Paper, IconButton, Chip, MenuItem, Select,
  FormControl, InputLabel, Alert, Tooltip, Stack,
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

export default function CompaniesList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [industryFilter, setIndustryFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const debouncedSearch = useDebounce(search, 400);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: rowsPerPage };
      if (debouncedSearch) params.search = debouncedSearch;
      if (industryFilter) params.industry = industryFilter;
      const res = await api.get('/companies', { params });
      const data = res.data.data || res.data;
      setCompanies(Array.isArray(data) ? data : data.items || data.companies || []);
      setTotal(res.data.total || res.data.pagination?.total || (Array.isArray(data) ? data.length : 0));
    } catch {
      setError(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, industryFilter]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const handleDelete = async () => {
    try {
      await api.delete(`/companies/${deleteId}`);
      setDeleteId(null);
      fetchCompanies();
    } catch {
      setError(t('errors.deleteFailed'));
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <PageHeader
        title={t('companies.title')}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/companies/new')}>
            {t('companies.new')}
          </Button>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <SearchBar value={search} onChange={setSearch} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t('companies.industry')}</InputLabel>
          <Select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} label={t('companies.industry')}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            <MenuItem value="technology">Technology</MenuItem>
            <MenuItem value="finance">Finance</MenuItem>
            <MenuItem value="healthcare">Healthcare</MenuItem>
            <MenuItem value="retail">Retail</MenuItem>
            <MenuItem value="manufacturing">Manufacturing</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('companies.name')}</TableCell>
                <TableCell>{t('companies.industry')}</TableCell>
                <TableCell>{t('companies.phone')}</TableCell>
                <TableCell>{t('companies.email')}</TableCell>
                <TableCell>{t('companies.website')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6}><LoadingSpinner /></TableCell></TableRow>
              ) : companies.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center">{t('common.noResults')}</TableCell></TableRow>
              ) : companies.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{c.name}</TableCell>
                  <TableCell>
                    {c.industry && <Chip label={c.industry} size="small" variant="outlined" />}
                  </TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>
                    {c.website && (
                      <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                        {c.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('common.view')}>
                      <IconButton size="small" onClick={() => navigate(`/companies/${c.id}`)}><VisibilityIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small" onClick={() => navigate(`/companies/${c.id}/edit`)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(c.id)}><DeleteIcon fontSize="small" /></IconButton>
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
        title={t('companies.deleteTitle')}
        message={t('companies.deleteMessage')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
