import React from 'react';
import { Box, CircularProgress } from '@mui/material';

export default function LoadingSpinner({ fullScreen = false, size = 40 }) {
  if (fullScreen) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress size={size} />
      </Box>
    );
  }
  return (
    <Box display="flex" alignItems="center" justifyContent="center" py={4}>
      <CircularProgress size={size} />
    </Box>
  );
}
