import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import { useAuth } from '../../store/AuthContext.jsx';

function LeadCard({ lead, onMove, canEdit }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: lead.id, stage: lead.stage }));
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
            onClick={() => navigate(`/leads/${lead.id}`)}
          >
            {lead.title}
          </Typography>
          {canEdit && (
            <Tooltip title={t('common.edit')}>
              <IconButton size="small" onClick={() => navigate(`/leads/${lead.id}/edit`)}>
                <EditIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {lead.companyName || lead.company_name ? (
          <Typography variant="caption" color="text.secondary" display="block">
            {lead.companyName || lead.company_name}
          </Typography>
        ) : null}
        {lead.value != null && (
          <Typography variant="caption" color="success.main" fontWeight={600}>
            €{Number(lead.value).toLocaleString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function KanbanBoard({ leads = [], onStageChange }) {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('leads.write');
  const [dragOverStage, setDragOverStage] = useState(null);

  const STAGES = [
    { key: 'new',         label: t('leads.stageNew'),         color: '#1976d2' },
    { key: 'contacted',   label: t('leads.stageContacted'),   color: '#7b1fa2' },
    { key: 'qualified',   label: t('leads.stageQualified'),   color: '#0288d1' },
    { key: 'proposal',    label: t('leads.stageProposal'),    color: '#ed6c02' },
    { key: 'negotiation', label: t('leads.stageNegotiation'), color: '#2e7d32' },
    { key: 'won',         label: t('leads.stageWon'),         color: '#1b5e20' },
    { key: 'lost',        label: t('leads.stageLost'),        color: '#c62828' },
  ];

  const byStage = STAGES.reduce((acc, s) => {
    acc[s.key] = leads.filter(l => l.stage === s.key);
    return acc;
  }, {});

  const handleDragOver = (e, stageKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageKey);
  };

  const handleDragLeave = () => setDragOverStage(null);

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    setDragOverStage(null);
    try {
      const { id, stage: currentStage } = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (currentStage !== targetStage && onStageChange) {
        onStageChange(id, targetStage);
      }
    } catch { /* ignore parse errors */ }
  };

  return (
    <Box display="flex" gap={2} overflow="auto" pb={2} sx={{ minHeight: 400 }}>
      {STAGES.map(stage => (
        <Box
          key={stage.key}
          onDragOver={canEdit ? (e) => handleDragOver(e, stage.key) : undefined}
          onDragLeave={canEdit ? handleDragLeave : undefined}
          onDrop={canEdit ? (e) => handleDrop(e, stage.key) : undefined}
          sx={{
            minWidth: 200,
            maxWidth: 220,
            flexShrink: 0,
            bgcolor: dragOverStage === stage.key ? 'action.hover' : 'grey.50',
            borderRadius: 2,
            p: 1.5,
            border: dragOverStage === stage.key ? '2px dashed' : '2px solid transparent',
            borderColor: dragOverStage === stage.key ? 'primary.main' : 'transparent',
            transition: 'background-color 0.15s, border-color 0.15s',
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: stage.color }} />
            <Typography variant="subtitle2" fontWeight={600}>{stage.label}</Typography>
            <Chip label={byStage[stage.key].length} size="small" sx={{ ml: 'auto', height: 18, fontSize: 11 }} />
          </Box>
          <Box>
            {byStage[stage.key].map(lead => (
              <LeadCard key={lead.id} lead={lead} onMove={onStageChange} canEdit={canEdit} />
            ))}
            {byStage[stage.key].length === 0 && (
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
