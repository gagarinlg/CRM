import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Divider, Collapse,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import FolderIcon from '@mui/icons-material/Folder';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import SecurityIcon from '@mui/icons-material/Security';
import TranslateIcon from '@mui/icons-material/Translate';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useAuth } from '../../store/AuthContext.jsx';
import { useTranslation } from '../../i18n/I18nContext.jsx';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'nav.dashboard', icon: <DashboardIcon />, path: '/' },
  { key: 'companies', label: 'nav.companies', icon: <BusinessIcon />, path: '/companies' },
  { key: 'contacts', label: 'nav.contacts', icon: <PeopleIcon />, path: '/contacts' },
  { key: 'projects', label: 'nav.projects', icon: <FolderIcon />, path: '/projects' },
  { key: 'leads', label: 'nav.leads', icon: <TrendingUpIcon />, path: '/leads' },
  { key: 'calendar', label: 'nav.calendar', icon: <CalendarTodayIcon />, path: '/calendar' },
  { key: 'reports', label: 'nav.reports', icon: <AssessmentIcon />, path: '/reports' },
];

const ADMIN_ITEMS = [
  { key: 'users', label: 'nav.users', icon: <PersonIcon />, path: '/admin/users' },
  { key: 'roles', label: 'nav.roles', icon: <SecurityIcon />, path: '/admin/roles' },
  { key: 'groups', label: 'nav.groups', icon: <GroupIcon />, path: '/admin/groups' },
  { key: 'translations', label: 'nav.translations', icon: <TranslateIcon />, path: '/admin/translations' },
  { key: 'settings', label: 'nav.settings', icon: <SettingsIcon />, path: '/admin/settings' },
];

function NavItem({ item, selected, onClick }) {
  const { t } = useTranslation();
  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={selected}
        onClick={() => onClick(item.path)}
        sx={{
          borderRadius: 1,
          mx: 1,
          mb: 0.5,
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'white',
            '& .MuiListItemIcon-root': { color: 'white' },
            '&:hover': { bgcolor: 'primary.dark' },
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
        <ListItemText primary={t(item.label)} primaryTypographyProps={{ fontSize: 14 }} />
      </ListItemButton>
    </ListItem>
  );
}

export default function Sidebar({ drawerWidth, mobileOpen, onClose, isMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const [adminOpen, setAdminOpen] = React.useState(false);

  const handleNav = (path) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const isSelected = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const content = (
    <Box display="flex" flexDirection="column" height="100%">
      <Box px={2} py={2.5} display="flex" alignItems="center" gap={1}>
        <TrendingUpIcon color="primary" />
        <Typography variant="h6" fontWeight={700} color="primary">CRM</Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.key}
            item={item}
            selected={isSelected(item.path)}
            onClick={handleNav}
          />
        ))}
        {isAdmin() && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setAdminOpen(o => !o)}
                sx={{ borderRadius: 1, mx: 1, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}><AdminPanelSettingsIcon /></ListItemIcon>
                <ListItemText primary={t('nav.admin')} primaryTypographyProps={{ fontSize: 14 }} />
                {adminOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={adminOpen} timeout="auto" unmountOnExit>
              <List disablePadding sx={{ pl: 1 }}>
                {ADMIN_ITEMS.map(item => (
                  <NavItem
                    key={item.key}
                    item={item}
                    selected={isSelected(item.path)}
                    onClick={handleNav}
                  />
                ))}
              </List>
            </Collapse>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth },
        }}
      >
        {content}
      </Drawer>
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: drawerWidth, position: 'fixed', height: '100vh' },
        }}
        open
      >
        {content}
      </Drawer>
    </>
  );
}
