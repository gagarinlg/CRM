import React, { useEffect, useState } from 'react';
import { Grid, Alert, Box, Chip, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import FolderIcon from '@mui/icons-material/Folder';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import api from '../services/api.js';
import { useTranslation } from '../i18n/I18nContext.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import DashboardWidget from '../components/Dashboard/DashboardWidget.jsx';
import KPIWidget from '../components/Dashboard/KPIWidget.jsx';
import ChartWidget from '../components/Dashboard/ChartWidget.jsx';
import dayjs from 'dayjs';

export default function Dashboard() {
  const { t } = useTranslation();
  const [kpis, setKpis] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [leadConversion, setLeadConversion] = useState([]);
  const [projectStatus, setProjectStatus] = useState([]);
  const [overdueContacts, setOverdueContacts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [kpiRes, revRes, leadRes, projRes, overdueRes, actRes] = await Promise.allSettled([
          api.get('/dashboard/widgets/kpis'),
          api.get('/dashboard/widgets/revenue'),
          api.get('/dashboard/widgets/lead-conversion'),
          api.get('/dashboard/widgets/project-status'),
          api.get('/dashboard/widgets/overdue-contacts'),
          api.get('/dashboard/widgets/recent-activity'),
        ]);
        if (kpiRes.status === 'fulfilled') setKpis(kpiRes.value.data.data || kpiRes.value.data);
        if (revRes.status === 'fulfilled') setRevenue(revRes.value.data.data || revRes.value.data || []);
        if (leadRes.status === 'fulfilled') setLeadConversion(leadRes.value.data.data || leadRes.value.data || []);
        if (projRes.status === 'fulfilled') setProjectStatus(projRes.value.data.data || projRes.value.data || []);
        if (overdueRes.status === 'fulfilled') setOverdueContacts(overdueRes.value.data.data || overdueRes.value.data || []);
        if (actRes.status === 'fulfilled') setRecentActivity(actRes.value.data.data || actRes.value.data || []);
      } catch {
        setError(t('errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const kpiItems = [
    { key: 'companies', label: t('nav.companies'), value: kpis?.totalCompanies, icon: <BusinessIcon />, color: 'primary.main' },
    { key: 'contacts', label: t('nav.contacts'), value: kpis?.totalContacts, icon: <PeopleIcon />, color: 'secondary.main' },
    { key: 'projects', label: t('nav.projects'), value: kpis?.activeProjects, icon: <FolderIcon />, color: 'success.main' },
    { key: 'leads', label: t('nav.leads'), value: kpis?.openLeads, icon: <TrendingUpIcon />, color: 'warning.main' },
  ];

  return (
    <Box>
      <PageHeader title={t('dashboard.title')} />
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        {kpiItems.map(item => (
          <Grid item xs={12} sm={6} lg={3} key={item.key}>
            <DashboardWidget>
              <KPIWidget
                label={item.label}
                value={item.value}
                icon={item.icon}
                color={item.color}
                loading={loading}
              />
            </DashboardWidget>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <DashboardWidget title={t('dashboard.revenue')}>
            <ChartWidget
              type="line"
              data={Array.isArray(revenue) ? revenue : []}
              dataKeys={['revenue', 'target']}
              xKey="month"
              height={260}
            />
          </DashboardWidget>
        </Grid>
        <Grid item xs={12} md={4}>
          <DashboardWidget title={t('dashboard.projectStatus')}>
            <ChartWidget
              type="pie"
              data={Array.isArray(projectStatus) ? projectStatus : []}
              dataKeys={['count']}
              xKey="status"
              height={260}
            />
          </DashboardWidget>
        </Grid>
      </Grid>

      {/* Lead Conversion + Overdue + Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <DashboardWidget title={t('dashboard.leadConversion')}>
            <ChartWidget
              type="bar"
              data={Array.isArray(leadConversion) ? leadConversion : []}
              dataKeys={['converted', 'lost', 'open']}
              xKey="stage"
              height={220}
            />
          </DashboardWidget>
        </Grid>
        <Grid item xs={12} md={6}>
          <DashboardWidget title={t('dashboard.overdueContacts')}>
            {overdueContacts.length === 0 ? (
              <Typography variant="body2" color="text.secondary" py={2}>{t('dashboard.noOverdue')}</Typography>
            ) : (
              <List dense disablePadding>
                {overdueContacts.slice(0, 5).map((c, i) => (
                  <React.Fragment key={c.id || i}>
                    <ListItem disableGutters>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'error.light', fontSize: 13 }}>
                          {c.firstName?.[0]}{c.lastName?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${c.firstName} ${c.lastName}`}
                        secondary={c.lastContactDate ? `Last: ${dayjs(c.lastContactDate).format('DD MMM YYYY')}` : 'Never contacted'}
                        primaryTypographyProps={{ fontSize: 14 }}
                        secondaryTypographyProps={{ fontSize: 12 }}
                      />
                      <Chip label={t('dashboard.overdue')} color="error" size="small" />
                    </ListItem>
                    {i < overdueContacts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </DashboardWidget>
        </Grid>
        <Grid item xs={12}>
          <DashboardWidget title={t('dashboard.recentActivity')}>
            {recentActivity.length === 0 ? (
              <Typography variant="body2" color="text.secondary" py={2}>{t('dashboard.noActivity')}</Typography>
            ) : (
              <List dense disablePadding>
                {recentActivity.slice(0, 8).map((a, i) => (
                  <React.Fragment key={a.id || i}>
                    <ListItem disableGutters>
                      <ListItemText
                        primary={a.description || a.action}
                        secondary={a.createdAt ? dayjs(a.createdAt).format('DD MMM YYYY HH:mm') : ''}
                        primaryTypographyProps={{ fontSize: 14 }}
                        secondaryTypographyProps={{ fontSize: 12 }}
                      />
                      {a.type && <Chip label={a.type} size="small" variant="outlined" />}
                    </ListItem>
                    {i < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </DashboardWidget>
        </Grid>
      </Grid>
    </Box>
  );
}
