import React, { useState } from 'react';
import {
  Box, Button, Grid, Card, CardContent, Typography, Alert,
  CircularProgress, MenuItem, Select, FormControl, InputLabel,
  TextField, Stack, Divider,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AssessmentIcon from '@mui/icons-material/Assessment';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import ChartWidget from '../../components/Dashboard/ChartWidget.jsx';
import DashboardWidget from '../../components/Dashboard/DashboardWidget.jsx';

const REPORTS = [
  { key: 'sales', label: 'reports.sales', endpoint: '/reports/sales' },
  { key: 'lead-pipeline', label: 'reports.leadPipeline', endpoint: '/reports/lead-pipeline' },
  { key: 'project-status', label: 'reports.projectStatus', endpoint: '/reports/project-status' },
  { key: 'contact-activity', label: 'reports.contactActivity', endpoint: '/reports/contact-activity' },
];

export default function ReportsPage() {
  const { t } = useTranslation();
  const [selectedReport, setSelectedReport] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    if (!selectedReport) return;
    setLoading(true);
    setError('');
    try {
      const report = REPORTS.find(r => r.key === selectedReport);
      const params = {};
      if (startDate) params.from = startDate;
      if (endDate) params.to = endDate;
      const res = await api.get(report.endpoint, { params });
      setReportData(res.data.data || res.data);
    } catch (err) {
      setError(err.response?.status === 403 ? t('errors.forbidden') : t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!reportData) return;
    const rows = Array.isArray(reportData) ? reportData : [reportData];
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(',');
    const body = rows.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${body}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = Array.isArray(reportData) ? reportData : [];
  const chartKeys = chartData.length > 0
    ? Object.keys(chartData[0]).filter(k => typeof chartData[0][k] === 'number').slice(0, 4)
    : [];
  const xKey = chartData.length > 0
    ? (Object.keys(chartData[0]).find(k => typeof chartData[0][k] === 'string') || 'name')
    : 'name';

  return (
    <Box>
      <PageHeader title={t('reports.title')} />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" mb={2}>{t('reports.filters')}</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>{t('reports.selectReport')}</InputLabel>
              <Select
                value={selectedReport}
                onChange={e => { setSelectedReport(e.target.value); setReportData(null); }}
                label={t('reports.selectReport')}
              >
                {REPORTS.map(r => (
                  <MenuItem key={r.key} value={r.key}>{t(r.label)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t('reports.startDate')}
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <TextField
              label={t('reports.endDate')}
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AssessmentIcon />}
              onClick={fetchReport}
              disabled={!selectedReport || loading}
            >
              {t('reports.generate')}
            </Button>
            {reportData && (
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadCSV}>
                {t('reports.download')}
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {reportData && (
        <Grid container spacing={3}>
          {chartData.length > 0 && chartKeys.length > 0 && (
            <Grid item xs={12}>
              <DashboardWidget title={t(`reports.${selectedReport.replace('-', '_')}`) || selectedReport}>
                <ChartWidget type="bar" data={chartData} dataKeys={chartKeys} xKey={xKey} height={300} />
              </DashboardWidget>
            </Grid>
          )}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" mb={2}>{t('reports.data')}</Typography>
                {chartData.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">{t('common.noResults')}</Typography>
                ) : (
                  <Box overflow="auto">
                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
                      <thead>
                        <tr>
                          {Object.keys(chartData[0]).map(k => (
                            <th key={k} style={{ textAlign: 'left', padding: '6px 12px', borderBottom: '1px solid #eee', background: '#f5f5f5' }}>{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.map((row, i) => (
                          <tr key={i} style={{ background: i % 2 ? '#fafafa' : '#fff' }}>
                            {Object.values(row).map((v, j) => (
                              <td key={j} style={{ padding: '6px 12px', borderBottom: '1px solid #f0f0f0' }}>{String(v ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
