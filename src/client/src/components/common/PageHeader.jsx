import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <Box mb={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={600}>{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>{subtitle}</Typography>
          )}
        </Box>
        {actions && <Box display="flex" gap={1} flexWrap="wrap">{actions}</Box>}
      </Box>
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
}
