import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Alert, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import api from '../../services/api.js';
import { useTranslation } from '../../i18n/I18nContext.jsx';
import { useAuth } from '../../store/AuthContext.jsx';
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
  const { user, hasPermission, isAdminUser, isManagerUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const canWrite = hasPermission('calendar.write');
  const canDelete = hasPermission('calendar.delete');

  const canEditEvent = (evt) =>
    canWrite && (evt?.created_by === user?.id || isAdminUser || isManagerUser);
  const canDeleteEvent = (evt) =>
    canDelete && (evt?.created_by === user?.id || isAdminUser || isManagerUser);

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
        allDay: e.is_all_day || false,
        backgroundColor: TYPE_COLORS[e.type] || '#1976d2',
        borderColor: TYPE_COLORS[e.type] || '#1976d2',
        extendedProps: {
          description: e.description,
          location: e.location,
          type: e.type,
          created_by: e.created_by,
        },
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
    const evt = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.startStr,
      end: info.event.endStr,
      allDay: info.event.allDay,
      ...info.event.extendedProps,
    };
    setSelectedEvent(evt);
    setFormOpen(true);
  };

  const handleDateSelect = (info) => {
    if (!canWrite) return;
    setSelectedEvent({ startDate: info.startStr, endDate: info.endStr, allDay: info.allDay });
    setFormOpen(true);
  };

  // Drag-and-drop: user moved an event to a new time
  const handleEventDrop = async (info) => {
    const evt = {
      id: info.event.id,
      created_by: info.event.extendedProps.created_by,
    };
    if (!canEditEvent(evt)) { info.revert(); return; }
    try {
      await api.put(`/calendar/${info.event.id}`, {
        start_datetime: info.event.startStr,
        end_datetime: info.event.endStr,
        is_all_day: info.event.allDay,
      });
      fetchEvents();
    } catch {
      info.revert();
      setError(t('errors.saveFailed'));
    }
  };

  // Resize: user changed event duration
  const handleEventResize = async (info) => {
    const evt = {
      id: info.event.id,
      created_by: info.event.extendedProps.created_by,
    };
    if (!canEditEvent(evt)) { info.revert(); return; }
    try {
      await api.put(`/calendar/${info.event.id}`, {
        start_datetime: info.event.startStr,
        end_datetime: info.event.endStr,
      });
      fetchEvents();
    } catch {
      info.revert();
      setError(t('errors.saveFailed'));
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/calendar/${deleteId}`);
      setDeleteId(null);
      setFormOpen(false);
      setSelectedEvent(null);
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
          canWrite && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setSelectedEvent(null); setFormOpen(true); }}>
              {t('calendar.newEvent')}
            </Button>
          )
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 2 }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          buttonText={{
            today: t('calendar.today', 'Today'),
            month: t('calendar.month', 'Month'),
            week: t('calendar.week', 'Week'),
            day: t('calendar.day', 'Day'),
            list: t('calendar.agenda', 'Agenda'),
          }}
          events={events}
          selectable={canWrite}
          selectMirror
          editable={canWrite}
          dayMaxEvents
          datesSet={handleDatesSet}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          height="auto"
        />
      </Paper>

      <EventForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setSelectedEvent(null); }}
        onSaved={() => fetchEvents()}
        event={selectedEvent}
        canEdit={canEditEvent(selectedEvent)}
        canDelete={canDeleteEvent(selectedEvent)}
        onDeleteRequest={(id) => setDeleteId(id)}
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
