import React from 'react';
import { Card, CardContent, CardHeader, Box } from '@mui/material';

export default function DashboardWidget({ title, children, action, sx = {} }) {
  return (
    <Card sx={{ height: '100%', ...sx }}>
      <CardHeader
        title={title}
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        action={action}
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 1 }}>
        <Box>{children}</Box>
      </CardContent>
    </Card>
  );
}
