import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, Box,
  Avatar, Menu, MenuItem, ListItemIcon, Divider, Tooltip, Select,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../../store/AuthContext.jsx';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import { LANGUAGES } from '../../i18n/languages.js';

export default function TopBar({ drawerWidth, onMenuClick }) {
  const { user, logout } = useAuth();
  const { t, locale, changeLocale } = useTranslation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.email?.[0]?.toUpperCase()
    : '?';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
        ml: { md: `${drawerWidth}px` },
        width: { md: `calc(100% - ${drawerWidth}px)` },
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Box flexGrow={1} />

        {/* Language selector */}
        <Select
          value={locale}
          onChange={e => changeLocale(e.target.value)}
          size="small"
          variant="standard"
          disableUnderline
          sx={{ mr: 2, fontSize: 14 }}
        >
          {LANGUAGES.map(lang => (
            <MenuItem key={lang.code} value={lang.code}>
              {lang.flag} {lang.code.toUpperCase()}
            </MenuItem>
          ))}
        </Select>

        {/* User menu */}
        <Tooltip title={t('nav.profile')}>
          <IconButton onClick={e => setAnchorEl(e.currentTarget)} size="small">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
              {initials}
            </Avatar>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box px={2} py={1}>
            <Typography variant="subtitle2">{user?.firstName} {user?.lastName}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
            <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
            {t('nav.profile')}
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/admin/settings'); }}>
            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
            {t('nav.settings')}
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            {t('auth.logout')}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
