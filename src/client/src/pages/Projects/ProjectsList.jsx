import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Paper, IconButton, Chip, Alert, Tooltip,
  Stack, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
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
import ProjectsKanbanBoard from '../../components/Projects/KanbanBoard.jsx';
import useDebounce from '../../hooks/useDebounce.js';
import dayjs from 'dayjs';

const STATUS_COLORS = {
  active: 'success', planning: 'info', completed: 'default', cancelled: 'error', on_hold: 'warning',
};

export default function ProjectsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const debouncedSearch = useDebounce(search, 400);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: rowsPerPage };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/projects', { params });
      const data = res.data.data || res.data;
      setProjects(Array.isArray(data) ? data : data.items || data.projects || []);
      setTotal(res.data.total || res.data.pagination?.total || (Array.isArray(data) ? data.length : 0));
    } catch {
      setError(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async () => {
    try {
      await api.delete(`/projects/${deleteId}`);
      setDeleteId(null);
      fetchProjects();
    } catch {
      setError(t('errors.deleteFailed'));
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <PageHeader
        title={t('projects.title')}
        actions={
          hasPermission('projects.write') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/projects/new')}>
              {t('projects.new')}
            </Button>
          )
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <SearchBar value={search} onChange={setSearch} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t('projects.status')}</InputLabel>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} label={t('projects.status')}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            <MenuItem value="planning">{t('projects.statusPlanning')}</MenuItem>
            <MenuItem value="active">{t('projects.statusActive')}</MenuItem>
            <MenuItem value="on_hold">{t('projects.statusOnHold')}</MenuItem>
            <MenuItem value="completed">{t('projects.statusCompleted')}</MenuItem>
            <MenuItem value="cancelled">{t('projects.statusCancelled')}</MenuItem>
          </Select>
        </FormControl>
        <ToggleButtonGroup value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)} size="small">
          <ToggleButton value="list"><ViewListIcon fontSize="small" /></ToggleButton>
          <ToggleButton value="kanban"><ViewKanbanIcon fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {viewMode === 'list' ? (
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('projects.name')}</TableCell>
                <TableCell>{t('projects.status')}</TableCell>
                <TableCell>{t('tags.title', 'Tags')}</TableCell>
                <TableCell>{t('projects.startDate')}</TableCell>
                <TableCell>{t('projects.endDate')}</TableCell>
                <TableCell>{t('projects.budget')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7}><LoadingSpinner /></TableCell></TableRow>
              ) : projects.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">{t('common.noResults')}</TableCell></TableRow>
              ) : projects.map(p => (
                <TableRow key={p.id} hover onClick={() => navigate(`/projects/${p.id}`)} sx={{ cursor: 'pointer' }}>
                  <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                  <TableCell>
                    <Chip label={p.status} size="small" color={STATUS_COLORS[p.status] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {(p.tags || []).map(tag => (
                        <Chip key={tag.id} label={tag.name} size="small" sx={{ bgcolor: tag.color || '#6b7280', color: '#fff', fontSize: 11, height: 20 }} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>{p.start_date ? dayjs(p.start_date).format('DD MMM YYYY') : '—'}</TableCell>
                  <TableCell>{p.end_date ? dayjs(p.end_date).format('DD MMM YYYY') : '—'}</TableCell>
                  <TableCell>{p.budget != null ? `€${Number(p.budget).toLocaleString()}` : '—'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('common.view')}>
                      <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/projects/${p.id}`); }}><VisibilityIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    {hasPermission('projects.write') && (
                      <Tooltip title={t('common.edit')}>
                        <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/projects/${p.id}/edit`); }}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                    {hasPermission('projects.delete') && (
                      <Tooltip title={t('common.delete')}>
                        <IconButton size="small" color="error" onClick={e => { e.stopPropagation(); setDeleteId(p.id); }}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
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
      ) : (
        <ProjectsKanbanBoard projects={projects} />
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t('projects.deleteTitle')}
        message={t('projects.deleteMessage')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
