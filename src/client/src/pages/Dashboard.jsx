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
    { key: 'companies', label: t('nav.companies'), value: kpis?.total_companies, icon: <BusinessIcon />, color: 'primary.main' },
    { key: 'contacts', label: t('nav.contacts'), value: kpis?.total_contacts, icon: <PeopleIcon />, color: 'secondary.main' },
    { key: 'projects', label: t('nav.projects'), value: kpis?.active_projects, icon: <FolderIcon />, color: 'success.main' },
    { key: 'leads', label: t('nav.leads'), value: kpis?.open_leads, icon: <TrendingUpIcon />, color: 'warning.main' },
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
              data={Array.isArray(leadConversion?.pipeline) ? leadConversion.pipeline : []}
              dataKeys={['count']}
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
                          {c.first_name?.[0]}{c.last_name?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${c.first_name} ${c.last_name}`}
                        secondary={c.remind_at ? `Due: ${dayjs(c.remind_at).format('DD MMM YYYY')}` : 'No date'}
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
                    <ListItem disableGutters alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: 12 }}>
                          {a.user_name ? a.user_name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box component="span">
                            <Typography component="span" variant="body2" fontWeight={600}>
                              {a.user_name || t('common.unknown')}
                            </Typography>
                            {' '}
                            <Typography component="span" variant="body2">
                              {a.action?.replace(/_/g, ' ')}
                            </Typography>
                            {a.entity_type && (
                              <Chip label={a.entity_type} size="small" variant="outlined" sx={{ ml: 1, height: 18, fontSize: 10 }} />
                            )}
                          </Box>
                        }
                        secondary={a.created_at ? dayjs(a.created_at).format('DD MMM YYYY HH:mm') : ''}
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ fontSize: 12 }}
                      />
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
