import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, IconButton, Tooltip, LinearProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import { useAuth } from '../../store/AuthContext.jsx';
import dayjs from 'dayjs';

function ProjectCard({ project, canEdit }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const progress = project.progress ?? 0;

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: project.id, status: project.status }));
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      sx={{ mb: 1, cursor: 'grab', '&:hover': { boxShadow: 4 }, '&:active': { cursor: 'grabbing' } }}
    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography
            variant="body2"
            fontWeight={500}
            sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            {project.name}
          </Typography>
          {canEdit && (
            <Tooltip title={t('common.edit')}>
              <IconButton size="small" onClick={() => navigate(`/projects/${project.id}/edit`)}>
                <EditIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {project.company_name && (
          <Typography variant="caption" color="text.secondary" display="block">{project.company_name}</Typography>
        )}
        {project.budget != null && (
          <Typography variant="caption" color="success.main" fontWeight={600}>
            €{Number(project.budget).toLocaleString()}
          </Typography>
        )}
        {project.end_date && (
          <Typography variant="caption" color="text.secondary" display="block">
            {dayjs(project.end_date).format('DD MMM YYYY')}
          </Typography>
        )}
        <Box mt={0.5}>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 4, borderRadius: 2 }} />
          <Typography variant="caption" color="text.secondary">{progress}%</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function KanbanBoard({ projects = [], onStatusChange }) {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('projects.write');
  const [dragOverStatus, setDragOverStatus] = useState(null);

  const STATUSES = [
    { key: 'planning',   label: t('projects.statusPlanning'),   color: '#0288d1' },
    { key: 'active',     label: t('projects.statusActive'),     color: '#2e7d32' },
    { key: 'on_hold',    label: t('projects.statusOnHold'),     color: '#ed6c02' },
    { key: 'completed',  label: t('projects.statusCompleted'),  color: '#1b5e20' },
    { key: 'cancelled',  label: t('projects.statusCancelled'),  color: '#c62828' },
  ];

  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s.key] = projects.filter(p => p.status === s.key);
    return acc;
  }, {});

  const handleDragOver = (e, statusKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(statusKey);
  };

  const handleDragLeave = () => setDragOverStatus(null);

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    try {
      const { id, status: currentStatus } = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (currentStatus !== targetStatus && onStatusChange) {
        onStatusChange(id, targetStatus);
      }
    } catch { /* ignore */ }
  };

  return (
    <Box display="flex" gap={2} overflow="auto" pb={2} sx={{ minHeight: 400 }}>
      {STATUSES.map(status => (
        <Box
          key={status.key}
          onDragOver={canEdit ? (e) => handleDragOver(e, status.key) : undefined}
          onDragLeave={canEdit ? handleDragLeave : undefined}
          onDrop={canEdit ? (e) => handleDrop(e, status.key) : undefined}
          sx={{
            minWidth: 200,
            maxWidth: 240,
            flexShrink: 0,
            bgcolor: dragOverStatus === status.key ? 'action.hover' : 'grey.50',
            borderRadius: 2,
            p: 1.5,
            border: dragOverStatus === status.key ? '2px dashed' : '2px solid transparent',
            borderColor: dragOverStatus === status.key ? 'primary.main' : 'transparent',
            transition: 'background-color 0.15s, border-color 0.15s',
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: status.color }} />
            <Typography variant="subtitle2" fontWeight={600}>{status.label}</Typography>
            <Chip label={byStatus[status.key].length} size="small" sx={{ ml: 'auto', height: 18, fontSize: 11 }} />
          </Box>
          <Box>
            {byStatus[status.key].map(project => (
              <ProjectCard key={project.id} project={project} canEdit={canEdit} />
            ))}
            {byStatus[status.key].length === 0 && (
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center" py={2}>
                {t('common.empty')}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
