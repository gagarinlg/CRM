import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Alert, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import EventForm from './EventForm.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';

const TYPE_COLORS = {
  meeting: '#1976d2',
  call: '#9c27b0',
  task: '#ed6c02',
  reminder: '#2e7d32',
  other: '#757575',
};

export default function CalendarPage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  const fetchEvents = async (start, end) => {
    try {
      const params = {};
      if (start) params.start = start;
      if (end) params.end = end;
      const res = await api.get('/calendar', { params });
      const data = res.data.data || res.data;
      const evts = Array.isArray(data) ? data : [];
      setEvents(evts.map(e => ({
        id: e.id,
        title: e.title,
        start: e.start_datetime,
        end: e.end_datetime,
        backgroundColor: TYPE_COLORS[e.type] || '#1976d2',
        borderColor: TYPE_COLORS[e.type] || '#1976d2',
        extendedProps: { description: e.description, location: e.location, type: e.type },
      })));
    } catch {
      setError(t('errors.fetchFailed'));
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleDatesSet = (info) => {
    fetchEvents(info.startStr, info.endStr);
  };

  const handleEventClick = (info) => {
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.startStr,
      end: info.event.endStr,
      ...info.event.extendedProps,
    });
    setFormOpen(true);
  };

  const handleDateSelect = (info) => {
    setSelectedEvent({ startDate: info.startStr, endDate: info.endStr });
    setFormOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/calendar/${deleteId}`);
      setDeleteId(null);
      setFormOpen(false);
      fetchEvents();
    } catch {
      setError(t('errors.deleteFailed'));
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <PageHeader
        title={t('calendar.title')}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setSelectedEvent(null); setFormOpen(true); }}>
            {t('calendar.newEvent')}
          </Button>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 2 }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          selectable
          selectMirror
          dayMaxEvents
          datesSet={handleDatesSet}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="auto"
        />
      </Paper>

      <EventForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setSelectedEvent(null); }}
        onSaved={() => fetchEvents()}
        event={selectedEvent}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t('calendar.deleteTitle')}
        message={t('calendar.deleteMessage')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
