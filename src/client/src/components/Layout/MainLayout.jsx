import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';

const DRAWER_WIDTH = 240;

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(prev => !prev);

  return (
    <Box display="flex" minHeight="100vh" bgcolor="background.default">
      <Sidebar
        drawerWidth={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isMobile={isMobile}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: { md: `${DRAWER_WIDTH}px` },
          minWidth: 0,
        }}
      >
        <TopBar drawerWidth={DRAWER_WIDTH} onMenuClick={handleDrawerToggle} />
        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
