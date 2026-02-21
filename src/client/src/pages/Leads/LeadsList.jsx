import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Paper, IconButton, Chip, Alert, Tooltip,
  Stack, MenuItem, Select, FormControl, InputLabel, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import { useAuth } from '../../store/AuthContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import KanbanBoard from '../../components/Leads/KanbanBoard.jsx';
import useDebounce from '../../hooks/useDebounce.js';

const STAGE_COLORS = {
  new: 'primary', contacted: 'secondary', qualified: 'info',
  proposal: 'warning', negotiation: 'warning', won: 'success', lost: 'error',
};

export default function LeadsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [stageFilter, setStageFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const debouncedSearch = useDebounce(search, 400);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: viewMode === 'kanban' ? 500 : rowsPerPage };
      if (debouncedSearch) params.search = debouncedSearch;
      if (stageFilter) params.stage = stageFilter;
      const res = await api.get('/leads', { params });
      const data = res.data.data || res.data;
      setLeads(Array.isArray(data) ? data : data.items || data.leads || []);
      setTotal(res.data.total || res.data.pagination?.total || (Array.isArray(data) ? data.length : 0));
    } catch {
      setError(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, stageFilter, viewMode]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleDelete = async () => {
    try {
      await api.delete(`/leads/${deleteId}`);
      setDeleteId(null);
      fetchLeads();
    } catch {
      setError(t('errors.deleteFailed'));
      setDeleteId(null);
    }
  };

  const handleStageChange = async (leadId, newStage) => {
    try {
      await api.patch(`/leads/${leadId}/stage`, { stage: newStage });
      fetchLeads();
    } catch {
      setError(t('errors.saveFailed'));
    }
  };

  return (
    <Box>
      <PageHeader
        title={t('leads.title')}
        actions={
          hasPermission('leads.write') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/leads/new')}>
              {t('leads.new')}
            </Button>
          )
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center">
        <SearchBar value={search} onChange={setSearch} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t('leads.stage')}</InputLabel>
          <Select value={stageFilter} onChange={e => setStageFilter(e.target.value)} label={t('leads.stage')}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            {['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map(s => (
              <MenuItem key={s} value={s}>{t(`leads.stage${s.charAt(0).toUpperCase() + s.slice(1)}`)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box ml="auto">
          <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small">
            <ToggleButton value="list"><ViewListIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="kanban"><ViewKanbanIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Stack>

      {viewMode === 'kanban' ? (
        loading ? <LoadingSpinner /> : <KanbanBoard leads={leads} onStageChange={handleStageChange} />
      ) : (
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('leads.title_field')}</TableCell>
                  <TableCell>{t('leads.stage')}</TableCell>
                  <TableCell>{t('tags.title', 'Tags')}</TableCell>
                  <TableCell>{t('leads.value')}</TableCell>
                  <TableCell>{t('leads.company')}</TableCell>
                  <TableCell>{t('leads.contact')}</TableCell>
                  <TableCell align="right">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7}><LoadingSpinner /></TableCell></TableRow>
                ) : leads.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center">{t('common.noResults')}</TableCell></TableRow>
                ) : leads.map(l => (
                  <TableRow key={l.id} hover onClick={() => navigate(`/leads/${l.id}`)} sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ fontWeight: 500 }}>{l.title}</TableCell>
                    <TableCell>
                      <Chip label={l.stage} size="small" color={STAGE_COLORS[l.stage] || 'default'} />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {(l.tags || []).map(tag => (
                          <Chip key={tag.id} label={tag.name} size="small" sx={{ bgcolor: tag.color || '#6b7280', color: '#fff', fontSize: 11, height: 20 }} />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>{l.value != null ? `€${Number(l.value).toLocaleString()}` : '—'}</TableCell>
                    <TableCell>{l.company_name || '—'}</TableCell>
                    <TableCell>{l.contact_name || '—'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={t('common.view')}>
                        <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/leads/${l.id}`); }}><VisibilityIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      {hasPermission('leads.write') && (
                        <Tooltip title={t('common.edit')}>
                          <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/leads/${l.id}/edit`); }}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      )}
                      {hasPermission('leads.delete') && (
                        <Tooltip title={t('common.delete')}>
                          <IconButton size="small" color="error" onClick={e => { e.stopPropagation(); setDeleteId(l.id); }}><DeleteIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {viewMode === 'list' && (
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          )}
        </Paper>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t('leads.deleteTitle')}
        message={t('leads.deleteMessage')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
