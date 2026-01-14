const express = require('express');
const router = express.Router();
const CalendarEvent = require('../models/Calendar');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const googleCalendarService = require('../services/googleCalendarService');

// Get all calendar events
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;
    const { start, end, category } = req.query;

    const query = { userId };

    if (start && end) {
      query.$or = [
        { start: { $gte: new Date(start), $lte: new Date(end) } },
        { end: { $gte: new Date(start), $lte: new Date(end) } },
        { start: { $lte: new Date(start) }, end: { $gte: new Date(end) } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const events = await CalendarEvent.find(query).sort({ start: 1 });
    res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single event
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;
    const event = await CalendarEvent.findOne({ _id: req.params.id, userId });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create calendar event
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;
    const {
      title,
      description,
      start,
      end,
      allDay,
      location,
      color,
      category,
      recurring,
      reminders,
      attendees,
      notes,
      tags,
      syncWithGoogle
    } = req.body;

    // Validate required fields
    if (!title || !start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Title, start, and end are required'
      });
    }

    // Validate dates
    if (new Date(start) >= new Date(end)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const eventData = {
      userId,
      title,
      description,
      start: new Date(start),
      end: new Date(end),
      allDay: allDay || false,
      location,
      color: color || '#1E49C9',
      category: category || 'personal',
      recurring: recurring || { isRecurring: false },
      reminders: reminders || [],
      attendees: attendees || [],
      notes,
      tags: tags || [],
      syncedWithGoogle: false
    };

    const event = new CalendarEvent(eventData);
    await event.save();

    // Sync with Google Calendar if requested and user has connected Google Calendar
    if (syncWithGoogle) {
      try {
        const user = await User.findById(userId);
        if (user && user.googleCalendarTokens) {
          googleCalendarService.setCredentials(user.googleCalendarTokens);
          const googleEvent = await googleCalendarService.createEvent({
            title,
            description,
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            location,
            color,
            reminders,
            recurring,
            attendees,
            visibility: 'default',
            status: 'confirmed',
            timeZone: user.preferences?.timezone || 'UTC'
          });

          event.googleCalendarEventId = googleEvent.id;
          event.googleCalendarId = googleEvent.id;
          event.syncedWithGoogle = true;
          event.lastSyncedAt = new Date();
          await event.save();
        }
      } catch (googleError) {
        console.error('Error syncing with Google Calendar:', googleError);
        // Don't fail the request if Google sync fails
      }
    }

    res.status(201).json({ success: true, event });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update calendar event
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;
    const event = await CalendarEvent.findOne({ _id: req.params.id, userId });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const {
      title,
      description,
      start,
      end,
      allDay,
      location,
      color,
      category,
      recurring,
      reminders,
      attendees,
      notes,
      tags,
      status,
      syncWithGoogle
    } = req.body;

    // Update fields
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (start !== undefined) event.start = new Date(start);
    if (end !== undefined) event.end = new Date(end);
    if (allDay !== undefined) event.allDay = allDay;
    if (location !== undefined) event.location = location;
    if (color !== undefined) event.color = color;
    if (category !== undefined) event.category = category;
    if (recurring !== undefined) event.recurring = recurring;
    if (reminders !== undefined) event.reminders = reminders;
    if (attendees !== undefined) event.attendees = attendees;
    if (notes !== undefined) event.notes = notes;
    if (tags !== undefined) event.tags = tags;
    if (status !== undefined) event.status = status;

    // Validate dates
    if (event.start >= event.end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    await event.save();

    // Sync with Google Calendar if requested and event is synced
    if (syncWithGoogle && event.syncedWithGoogle && event.googleCalendarEventId) {
      try {
        const user = await User.findById(userId);
        if (user && user.googleCalendarTokens) {
          googleCalendarService.setCredentials(user.googleCalendarTokens);
          await googleCalendarService.updateEvent(event.googleCalendarEventId, {
            title: event.title,
            description: event.description,
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            location: event.location,
            color: event.color,
            reminders: event.reminders,
            recurring: event.recurring,
            attendees: event.attendees,
            visibility: event.visibility || 'default',
            status: event.status,
            timeZone: user.preferences?.timezone || 'UTC'
          });

          event.lastSyncedAt = new Date();
          await event.save();
        }
      } catch (googleError) {
        console.error('Error syncing with Google Calendar:', googleError);
        // Don't fail the request if Google sync fails
      }
    }

    res.json({ success: true, event });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete calendar event
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;
    const event = await CalendarEvent.findOne({ _id: req.params.id, userId });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Delete from Google Calendar if synced
    if (event.syncedWithGoogle && event.googleCalendarEventId) {
      try {
        const user = await User.findById(userId);
        if (user && user.googleCalendarTokens) {
          googleCalendarService.setCredentials(user.googleCalendarTokens);
          await googleCalendarService.deleteEvent(event.googleCalendarEventId);
        }
      } catch (googleError) {
        console.error('Error deleting from Google Calendar:', googleError);
        // Continue with local deletion even if Google deletion fails
      }
    }

    await CalendarEvent.deleteOne({ _id: req.params.id, userId });
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Google Calendar OAuth - Get authorization URL
router.get('/google/auth', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;
    const authUrl = googleCalendarService.getAuthUrl(userId);
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Google Calendar OAuth - Callback (no auth required - it's a callback from Google)
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/calendar?error=auth_failed`);
    }

    // Exchange code for tokens
    const tokens = await googleCalendarService.getTokens(code);

    // Update user with tokens
    const userId = state;
    await User.findByIdAndUpdate(userId, {
      googleCalendarTokens: tokens,
      googleCalendarConnected: true,
      googleCalendarConnectedAt: new Date()
    });

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/calendar?connected=true`);
  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/calendar?error=callback_failed`);
  }
});

// Disconnect Google Calendar
router.post('/google/disconnect', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;
    
    await User.findByIdAndUpdate(userId, {
      $unset: { googleCalendarTokens: 1 },
      googleCalendarConnected: false
    });

    // Update all synced events to mark as not synced
    await CalendarEvent.updateMany(
      { userId, syncedWithGoogle: true },
      { 
        syncedWithGoogle: false,
        googleCalendarEventId: null,
        googleCalendarId: null
      }
    );

    res.json({ success: true, message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Sync all events to Google Calendar
router.post('/google/sync', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.googleCalendarTokens) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar not connected'
      });
    }

    googleCalendarService.setCredentials(user.googleCalendarTokens);

    // Get all events that aren't synced
    const unsyncedEvents = await CalendarEvent.find({
      userId,
      syncedWithGoogle: false,
      status: { $ne: 'cancelled' }
    });

    let syncedCount = 0;
    let errorCount = 0;

    for (const event of unsyncedEvents) {
      try {
        const googleEvent = await googleCalendarService.createEvent({
          title: event.title,
          description: event.description,
          start: event.start.toISOString(),
          end: event.end.toISOString(),
          location: event.location,
          color: event.color,
          reminders: event.reminders,
          recurring: event.recurring,
          attendees: event.attendees,
          visibility: event.visibility || 'default',
          status: event.status,
          timeZone: user.preferences?.timezone || 'UTC'
        });

        event.googleCalendarEventId = googleEvent.id;
        event.googleCalendarId = googleEvent.id;
        event.syncedWithGoogle = true;
        event.lastSyncedAt = new Date();
        await event.save();
        syncedCount++;
      } catch (error) {
        console.error(`Error syncing event ${event._id}:`, error);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedCount} events. ${errorCount} errors.`,
      syncedCount,
      errorCount
    });
  } catch (error) {
    console.error('Error syncing events:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Import events from Google Calendar
router.post('/google/import', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;
    const { start, end } = req.body;
    const user = await User.findById(userId);

    if (!user || !user.googleCalendarTokens) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar not connected'
      });
    }

    googleCalendarService.setCredentials(user.googleCalendarTokens);

    const timeMin = start ? new Date(start).toISOString() : new Date().toISOString();
    const timeMax = end ? new Date(end).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const googleEvents = await googleCalendarService.listEvents(timeMin, timeMax);

    let importedCount = 0;
    let skippedCount = 0;

    for (const googleEvent of googleEvents) {
      // Check if event already exists
      const existingEvent = await CalendarEvent.findOne({
        userId,
        googleCalendarEventId: googleEvent.id
      });

      if (existingEvent) {
        skippedCount++;
        continue;
      }

      // Create local event from Google event
      const event = new CalendarEvent({
        userId,
        title: googleEvent.summary || 'Untitled Event',
        description: googleEvent.description || '',
        start: new Date(googleEvent.start.dateTime || googleEvent.start.date),
        end: new Date(googleEvent.end.dateTime || googleEvent.end.date),
        allDay: !googleEvent.start.dateTime,
        location: googleEvent.location || '',
        color: '#1E49C9', // Default color
        category: 'personal',
        googleCalendarEventId: googleEvent.id,
        googleCalendarId: googleEvent.id,
        syncedWithGoogle: true,
        lastSyncedAt: new Date(),
        status: googleEvent.status || 'confirmed',
        visibility: googleEvent.visibility || 'default',
        reminders: googleEvent.reminders?.overrides || [],
        attendees: googleEvent.attendees?.map(a => ({
          email: a.email,
          name: a.displayName,
          responseStatus: a.responseStatus || 'needsAction'
        })) || []
      });

      await event.save();
      importedCount++;
    }

    res.json({
      success: true,
      message: `Imported ${importedCount} events. ${skippedCount} already existed.`,
      importedCount,
      skippedCount
    });
  } catch (error) {
    console.error('Error importing events:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
