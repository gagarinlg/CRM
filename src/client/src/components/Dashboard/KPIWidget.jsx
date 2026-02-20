import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

export default function KPIWidget({ label, value, trend, trendLabel, icon, color = 'primary.main', loading }) {
  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={80} />
        <Skeleton variant="text" width={60} height={40} />
        <Skeleton variant="text" width={100} />
      </Box>
    );
  }
  const trendPositive = trend > 0;
  return (
    <Box display="flex" alignItems="flex-start" gap={2}>
      {icon && (
        <Box
          sx={{
            bgcolor: `${color}15`,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            color,
          }}
        >
          {icon}
        </Box>
      )}
      <Box>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h4" fontWeight={700} color={color}>{value ?? '—'}</Typography>
        {trend !== undefined && (
          <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
            {trendPositive ? (
              <TrendingUpIcon fontSize="small" color="success" />
            ) : (
              <TrendingDownIcon fontSize="small" color="error" />
            )}
            <Typography variant="caption" color={trendPositive ? 'success.main' : 'error.main'}>
              {trendLabel || `${Math.abs(trend)}%`}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
