import React from 'react';
import { Box, Card, CardContent, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/I18nContext.jsx';

const STAGES = [
  { key: 'new', label: 'New', color: '#1976d2' },
  { key: 'contacted', label: 'Contacted', color: '#7b1fa2' },
  { key: 'qualified', label: 'Qualified', color: '#0288d1' },
  { key: 'proposal', label: 'Proposal', color: '#ed6c02' },
  { key: 'negotiation', label: 'Negotiation', color: '#2e7d32' },
  { key: 'won', label: 'Won', color: '#1b5e20' },
  { key: 'lost', label: 'Lost', color: '#c62828' },
];

function LeadCard({ lead, onMove }) {
  const navigate = useNavigate();
  return (
    <Card sx={{ mb: 1, '&:hover': { boxShadow: 4 } }}>
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
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => navigate(`/leads/${lead.id}/edit`)}>
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
        {lead.companyName && (
          <Typography variant="caption" color="text.secondary" display="block">{lead.companyName}</Typography>
        )}
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

  const byStage = STAGES.reduce((acc, s) => {
    acc[s.key] = leads.filter(l => l.stage === s.key);
    return acc;
  }, {});

  return (
    <Box
      display="flex"
      gap={2}
      overflow="auto"
      pb={2}
      sx={{ minHeight: 400 }}
    >
      {STAGES.map(stage => (
        <Box
          key={stage.key}
          sx={{
            minWidth: 200,
            maxWidth: 220,
            flexShrink: 0,
            bgcolor: 'grey.50',
            borderRadius: 2,
            p: 1.5,
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: stage.color }} />
            <Typography variant="subtitle2" fontWeight={600}>{stage.label}</Typography>
            <Chip label={byStage[stage.key].length} size="small" sx={{ ml: 'auto', height: 18, fontSize: 11 }} />
          </Box>
          <Box>
            {byStage[stage.key].map(lead => (
              <LeadCard key={lead.id} lead={lead} onMove={onStageChange} />
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
