import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Settings, RefreshCw, Download, Upload, X, Clock, MapPin, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { buildApiUrl } from '../config';
import toast from 'react-hot-toast';
import { Button, Card } from '../components/ui';

const Calendar = () => {
  const { user, token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    allDay: false,
    location: '',
    color: '#1E49C9',
    category: 'personal',
    reminders: [],
    notes: '',
    tags: [],
    syncWithGoogle: false
  });

  // Load events
  useEffect(() => {
    if (token) {
      loadEvents();
      checkGoogleConnection();
    }
  }, [currentDate, token]);

  // Handle Google Calendar callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');

    if (connected === 'true') {
      toast.success('Google Calendar connected successfully!');
      setGoogleConnected(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      toast.error('Failed to connect Google Calendar');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const response = await axios.get(buildApiUrl('/api/calendar'), {
        params: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString()
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const checkGoogleConnection = async () => {
    try {
      // Check if user has Google Calendar connected
      if (user?.googleCalendarConnected) {
        setGoogleConnected(true);
      } else {
        setGoogleConnected(false);
      }
    } catch (error) {
      console.error('Error checking Google connection:', error);
      setGoogleConnected(false);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      const response = await axios.get(buildApiUrl('/api/calendar/google/auth'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      toast.error('Failed to connect Google Calendar');
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      await axios.post(buildApiUrl('/api/calendar/google/disconnect'), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGoogleConnected(false);
      toast.success('Google Calendar disconnected');
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast.error('Failed to disconnect Google Calendar');
    }
  };

  const syncToGoogle = async () => {
    try {
      setSyncing(true);
      const response = await axios.post(buildApiUrl('/api/calendar/google/sync'), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Synced ${response.data.syncedCount} events to Google Calendar`);
      loadEvents();
    } catch (error) {
      console.error('Error syncing to Google:', error);
      toast.error('Failed to sync events');
    } finally {
      setSyncing(false);
    }
  };

  const importFromGoogle = async () => {
    try {
      setSyncing(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const response = await axios.post(buildApiUrl('/api/calendar/google/import'), {
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Imported ${response.data.importedCount} events from Google Calendar`);
      loadEvents();
    } catch (error) {
      console.error('Error importing from Google:', error);
      toast.error('Failed to import events');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setEventForm({
      title: '',
      description: '',
      start: '',
      end: '',
      allDay: false,
      location: '',
      color: '#1E49C9',
      category: 'personal',
      reminders: [],
      notes: '',
      tags: [],
      syncWithGoogle: googleConnected
    });
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      start: new Date(event.start).toISOString().slice(0, 16),
      end: new Date(event.end).toISOString().slice(0, 16),
      allDay: event.allDay || false,
      location: event.location || '',
      color: event.color || '#1E49C9',
      category: event.category || 'personal',
      reminders: event.reminders || [],
      notes: event.notes || '',
      tags: event.tags || [],
      syncWithGoogle: event.syncedWithGoogle || false
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    try {
      if (!eventForm.title || !eventForm.start || !eventForm.end) {
        toast.error('Please fill in all required fields');
        return;
      }

      const eventData = {
        ...eventForm,
        start: new Date(eventForm.start).toISOString(),
        end: new Date(eventForm.end).toISOString()
      };

      if (selectedEvent) {
        await axios.put(buildApiUrl(`/api/calendar/${selectedEvent._id}`), eventData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Event updated successfully');
      } else {
        await axios.post(buildApiUrl('/api/calendar'), eventData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Event created successfully');
      }

      setShowEventModal(false);
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await axios.delete(buildApiUrl(`/api/calendar/${eventId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Event deleted successfully');
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  // Calendar rendering
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const eventStart = new Date(event.start);
      return eventStart.getDate() === day &&
             eventStart.getMonth() === currentDate.getMonth() &&
             eventStart.getFullYear() === currentDate.getFullYear();
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#E8EEF2] font-oswald tracking-tight mb-2">
            Calendar
          </h1>
          <p className="text-[#94A3B8]">Manage your events and sync with Google Calendar</p>
        </div>
        <div className="flex gap-3">
          {googleConnected ? (
            <>
              <Button
                onClick={syncToGoogle}
                disabled={syncing}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                Sync to Google
              </Button>
              <Button
                onClick={importFromGoogle}
                disabled={syncing}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Import from Google
              </Button>
              <Button
                onClick={disconnectGoogleCalendar}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              onClick={connectGoogleCalendar}
              variant="primary"
              className="flex items-center gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              Connect Google Calendar
            </Button>
          )}
          <Button
            onClick={handleCreateEvent}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-[#2A313A] rounded-lg transition-colors"
            >
              ←
            </button>
            <h2 className="text-2xl font-bold text-[#E8EEF2]">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-[#2A313A] rounded-lg transition-colors"
            >
              →
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-[#1E49C9] text-white rounded-lg hover:bg-[#1E49C9]/80 transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-[#94A3B8] py-2">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day && 
              new Date().getDate() === day &&
              new Date().getMonth() === currentDate.getMonth() &&
              new Date().getFullYear() === currentDate.getFullYear();

            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-[#2A313A] rounded-lg ${
                  isToday ? 'bg-[#1E49C9]/20 border-[#1E49C9]' : 'bg-[#11151A]/50'
                } ${day ? 'cursor-pointer hover:bg-[#2A313A]' : ''}`}
                onClick={() => day && handleCreateEvent()}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-[#1E49C9]' : 'text-[#E8EEF2]'}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(event);
                          }}
                          className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: event.color || '#1E49C9' }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-[#94A3B8]">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#11151A] border border-[#2A313A] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-[#E8EEF2]">
                  {selectedEvent ? 'Edit Event' : 'Create Event'}
                </h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-[#94A3B8] hover:text-[#E8EEF2]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#E8EEF2] mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2A313A] border border-[#3A4149] rounded-lg text-[#E8EEF2] focus:outline-none focus:border-[#1E49C9]"
                    placeholder="Event title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#E8EEF2] mb-2">
                    Description
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2A313A] border border-[#3A4149] rounded-lg text-[#E8EEF2] focus:outline-none focus:border-[#1E49C9]"
                    rows={3}
                    placeholder="Event description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#E8EEF2] mb-2">
                      Start *
                    </label>
                    <input
                      type="datetime-local"
                      value={eventForm.start}
                      onChange={(e) => setEventForm({ ...eventForm, start: e.target.value })}
                      className="w-full px-4 py-2 bg-[#2A313A] border border-[#3A4149] rounded-lg text-[#E8EEF2] focus:outline-none focus:border-[#1E49C9]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#E8EEF2] mb-2">
                      End *
                    </label>
                    <input
                      type="datetime-local"
                      value={eventForm.end}
                      onChange={(e) => setEventForm({ ...eventForm, end: e.target.value })}
                      className="w-full px-4 py-2 bg-[#2A313A] border border-[#3A4149] rounded-lg text-[#E8EEF2] focus:outline-none focus:border-[#1E49C9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#E8EEF2] mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2A313A] border border-[#3A4149] rounded-lg text-[#E8EEF2] focus:outline-none focus:border-[#1E49C9]"
                    placeholder="Event location"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#E8EEF2] mb-2">
                      Category
                    </label>
                    <select
                      value={eventForm.category}
                      onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                      className="w-full px-4 py-2 bg-[#2A313A] border border-[#3A4149] rounded-lg text-[#E8EEF2] focus:outline-none focus:border-[#1E49C9]"
                    >
                      <option value="personal">Personal</option>
                      <option value="work">Work</option>
                      <option value="health">Health</option>
                      <option value="finance">Finance</option>
                      <option value="social">Social</option>
                      <option value="travel">Travel</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#E8EEF2] mb-2">
                      Color
                    </label>
                    <input
                      type="color"
                      value={eventForm.color}
                      onChange={(e) => setEventForm({ ...eventForm, color: e.target.value })}
                      className="w-full h-10 bg-[#2A313A] border border-[#3A4149] rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {googleConnected && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="syncWithGoogle"
                      checked={eventForm.syncWithGoogle}
                      onChange={(e) => setEventForm({ ...eventForm, syncWithGoogle: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="syncWithGoogle" className="text-sm text-[#E8EEF2]">
                      Sync with Google Calendar
                    </label>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveEvent}
                    variant="primary"
                    className="flex-1"
                  >
                    {selectedEvent ? 'Update Event' : 'Create Event'}
                  </Button>
                  {selectedEvent && (
                    <Button
                      onClick={() => handleDeleteEvent(selectedEvent._id)}
                      variant="secondary"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calendar;
