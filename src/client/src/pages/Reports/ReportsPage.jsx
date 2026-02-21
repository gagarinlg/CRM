import React, { useState } from 'react';
import {
  Box, Button, Grid, Card, CardContent, Typography, Alert,
  CircularProgress, MenuItem, Select, FormControl, InputLabel,
  TextField, Stack,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AssessmentIcon from '@mui/icons-material/Assessment';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import ChartWidget from '../../components/Dashboard/ChartWidget.jsx';
import DashboardWidget from '../../components/Dashboard/DashboardWidget.jsx';

const REPORTS = [
  { key: 'sales', label: 'reports.sales', endpoint: '/reports/sales', dataKey: 'leads', summaryKeys: ['summary'] },
  { key: 'lead-pipeline', label: 'reports.leadPipeline', endpoint: '/reports/lead-pipeline', dataKey: 'pipeline', summaryKeys: ['total_leads'] },
  { key: 'project-status', label: 'reports.projectStatus', endpoint: '/reports/project-status', dataKey: 'projects', summaryKeys: ['statuses'] },
  { key: 'contact-activity', label: 'reports.contactActivity', endpoint: '/reports/contact-activity', dataKey: 'contacts', summaryKeys: ['overdue_reminders'] },
];

export default function ReportsPage() {
  const { t } = useTranslation();
  const [selectedReport, setSelectedReport] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [reportRows, setReportRows] = useState([]);
  const [reportMeta, setReportMeta] = useState({});
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
      const raw = res.data.data || res.data;
      setReportData(raw);
      // Extract the primary data array using the report's dataKey
      const rows = raw[report.dataKey] ?? (Array.isArray(raw) ? raw : []);
      setReportRows(rows);
      // Collect summary/metadata fields
      const meta = {};
      (report.summaryKeys || []).forEach(k => {
        if (raw[k] !== undefined) meta[k] = raw[k];
      });
      setReportMeta(meta);
    } catch (err) {
      setError(err.response?.status === 403 ? t('errors.forbidden') : t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!reportRows.length) return;
    const headers = Object.keys(reportRows[0]).join(',');
    const body = reportRows.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${body}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = reportRows;
  const chartKeys = chartData.length > 0
    ? Object.keys(chartData[0]).filter(k => typeof chartData[0][k] === 'number' || (typeof chartData[0][k] === 'string' && !isNaN(parseFloat(chartData[0][k])))).slice(0, 4)
    : [];
  const xKey = chartData.length > 0
    ? (Object.keys(chartData[0]).find(k => typeof chartData[0][k] === 'string' && isNaN(parseFloat(chartData[0][k]))) || Object.keys(chartData[0])[0])
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
          </Stack>
        </CardContent>
      </Card>

      {reportData && (
        <Grid container spacing={3}>
          {/* Summary/metadata cards */}
          {Object.keys(reportMeta).length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" mb={1}>{t('reports.summary') || 'Summary'}</Typography>
                  <Stack direction="row" spacing={3} flexWrap="wrap">
                    {Object.entries(reportMeta).map(([k, v]) => (
                      <Box key={k}>
                        <Typography variant="caption" color="text.secondary">{k.replace(/_/g, ' ')}</Typography>
                        <Typography variant="h6">{Array.isArray(v) ? v.length : String(v ?? '—')}</Typography>
                      </Box>
                    ))}
                    <Box>
                      <Typography variant="caption" color="text.secondary">total rows</Typography>
                      <Typography variant="h6">{reportRows.length}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
          {chartData.length > 0 && chartKeys.length > 0 && (
            <Grid item xs={12}>
              <DashboardWidget title={t(`reports.${selectedReport.replace(/-/g, '_')}`) || selectedReport}>
                <ChartWidget type="bar" data={chartData} dataKeys={chartKeys} xKey={xKey} height={300} />
              </DashboardWidget>
            </Grid>
          )}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle2">{t('reports.data')}</Typography>
                  {reportRows.length > 0 && (
                    <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={downloadCSV}>
                      {t('reports.download')}
                    </Button>
                  )}
                </Stack>
                {reportRows.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">{t('reports.noData') || t('common.noResults')}</Typography>
                ) : (
                  <Box overflow="auto">
                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
                      <thead>
                        <tr>
                          {Object.keys(reportRows[0]).map(k => (
                            <th key={k} style={{ textAlign: 'left', padding: '6px 12px', borderBottom: '1px solid #eee', background: '#f5f5f5' }}>{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportRows.map((row, i) => (
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
