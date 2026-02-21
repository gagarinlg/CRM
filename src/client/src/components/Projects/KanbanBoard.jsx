import React from 'react';
import { Box, Card, CardContent, Typography, Chip, IconButton, Tooltip, LinearProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import dayjs from 'dayjs';

function ProjectCard({ project }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const progress = project.progress ?? 0;
  return (
    <Card sx={{ mb: 1, '&:hover': { boxShadow: 4 } }}>
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
          <Tooltip title={t('common.edit')}>
            <IconButton size="small" onClick={() => navigate(`/projects/${project.id}/edit`)}>
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
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

export default function KanbanBoard({ projects = [] }) {
  const { t } = useTranslation();

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

  return (
    <Box display="flex" gap={2} overflow="auto" pb={2} sx={{ minHeight: 400 }}>
      {STATUSES.map(status => (
        <Box
          key={status.key}
          sx={{ minWidth: 200, maxWidth: 240, flexShrink: 0, bgcolor: 'grey.50', borderRadius: 2, p: 1.5 }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: status.color }} />
            <Typography variant="subtitle2" fontWeight={600}>{status.label}</Typography>
            <Chip label={byStatus[status.key].length} size="small" sx={{ ml: 'auto', height: 18, fontSize: 11 }} />
          </Box>
          <Box>
            {byStatus[status.key].map(project => (
              <ProjectCard key={project.id} project={project} />
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
