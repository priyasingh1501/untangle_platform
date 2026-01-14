const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = null;
    this.calendar = null;
    this.isConfigured = false;
    this.initialize();
  }

  initialize() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/google/callback';

    if (!clientId || !clientSecret) {
      console.warn('⚠️ Google Calendar not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
      this.isConfigured = false;
      return;
    }

    this.oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUri
    );

    this.isConfigured = true;
    console.log('✅ Google Calendar service initialized');
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthUrl(userId) {
    if (!this.isConfigured) {
      throw new Error('Google Calendar is not configured');
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: userId.toString() // Pass userId in state for security
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code) {
    if (!this.isConfigured) {
      throw new Error('Google Calendar is not configured');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  /**
   * Set user's access token
   */
  setCredentials(tokens) {
    if (!this.isConfigured) {
      throw new Error('Google Calendar is not configured');
    }
    this.oauth2Client.setCredentials(tokens);
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Create event in Google Calendar
   */
  async createEvent(eventData) {
    if (!this.calendar) {
      throw new Error('Calendar client not initialized. Set credentials first.');
    }

    const googleEvent = {
      summary: eventData.title,
      description: eventData.description || '',
      start: {
        dateTime: eventData.start,
        timeZone: eventData.timeZone || 'UTC'
      },
      end: {
        dateTime: eventData.end,
        timeZone: eventData.timeZone || 'UTC'
      },
      location: eventData.location || '',
      colorId: this.mapColorToGoogleColor(eventData.color),
      reminders: {
        useDefault: false,
        overrides: (eventData.reminders || []).map(reminder => ({
          method: reminder.method === 'popup' ? 'popup' : 'email',
          minutes: reminder.minutes || 15
        }))
      },
      visibility: eventData.visibility || 'default',
      status: eventData.status || 'confirmed'
    };

    // Add recurring rule if applicable
    if (eventData.recurring && eventData.recurring.isRecurring) {
      googleEvent.recurrence = [
        this.buildRecurrenceRule(eventData.recurring)
      ];
    }

    // Add attendees if any
    if (eventData.attendees && eventData.attendees.length > 0) {
      googleEvent.attendees = eventData.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name
      }));
    }

    const response = await this.calendar.events.insert({
      calendarId: 'primary',
      resource: googleEvent
    });

    return response.data;
  }

  /**
   * Update event in Google Calendar
   */
  async updateEvent(eventId, eventData) {
    if (!this.calendar) {
      throw new Error('Calendar client not initialized. Set credentials first.');
    }

    const googleEvent = {
      summary: eventData.title,
      description: eventData.description || '',
      start: {
        dateTime: eventData.start,
        timeZone: eventData.timeZone || 'UTC'
      },
      end: {
        dateTime: eventData.end,
        timeZone: eventData.timeZone || 'UTC'
      },
      location: eventData.location || '',
      colorId: this.mapColorToGoogleColor(eventData.color),
      reminders: {
        useDefault: false,
        overrides: (eventData.reminders || []).map(reminder => ({
          method: reminder.method === 'popup' ? 'popup' : 'email',
          minutes: reminder.minutes || 15
        }))
      },
      visibility: eventData.visibility || 'default',
      status: eventData.status || 'confirmed'
    };

    // Update recurring rule if applicable
    if (eventData.recurring && eventData.recurring.isRecurring) {
      googleEvent.recurrence = [
        this.buildRecurrenceRule(eventData.recurring)
      ];
    }

    const response = await this.calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: googleEvent
    });

    return response.data;
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEvent(eventId) {
    if (!this.calendar) {
      throw new Error('Calendar client not initialized. Set credentials first.');
    }

    await this.calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    });

    return true;
  }

  /**
   * List events from Google Calendar
   */
  async listEvents(timeMin, timeMax, maxResults = 250) {
    if (!this.calendar) {
      throw new Error('Calendar client not initialized. Set credentials first.');
    }

    const response = await this.calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime'
    });

    return response.data.items || [];
  }

  /**
   * Sync local events to Google Calendar
   */
  async syncToGoogle(localEvent, tokens) {
    try {
      this.setCredentials(tokens);
      
      if (localEvent.googleCalendarEventId) {
        // Update existing event
        return await this.updateEvent(localEvent.googleCalendarEventId, localEvent);
      } else {
        // Create new event
        return await this.createEvent(localEvent);
      }
    } catch (error) {
      console.error('Error syncing event to Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Build recurrence rule for Google Calendar
   */
  buildRecurrenceRule(recurring) {
    const { pattern, interval, endDate, occurrences } = recurring;
    
    let rule = `RRULE:FREQ=${pattern.toUpperCase()}`;
    if (interval && interval > 1) {
      rule += `;INTERVAL=${interval}`;
    }
    if (endDate) {
      const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      rule += `;UNTIL=${endDateStr}`;
    }
    if (occurrences) {
      rule += `;COUNT=${occurrences}`;
    }

    return rule;
  }

  /**
   * Map our color to Google Calendar color ID
   */
  mapColorToGoogleColor(color) {
    const colorMap = {
      '#1E49C9': '9', // Blue
      '#FF6B6B': '11', // Red
      '#4ECDC4': '10', // Teal
      '#FFD93D': '5', // Yellow
      '#95E1D3': '6', // Green
      '#F38181': '11', // Red
      '#AA96DA': '3', // Purple
      '#FCBAD3': '7', // Pink
      '#FFD200': '5', // Yellow
      '#3EA6FF': '1' // Lavender
    };

    return colorMap[color] || '9'; // Default to blue
  }

  /**
   * Refresh access token if expired
   */
  async refreshAccessToken(refreshToken) {
    if (!this.isConfigured) {
      throw new Error('Google Calendar is not configured');
    }

    this.oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials;
  }
}

module.exports = new GoogleCalendarService();
