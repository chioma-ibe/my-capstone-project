const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class CalendarService {
  constructor() {
    this.calendar = google.calendar('v3');
  }

  createOAuth2Client(accessToken) {
    const oAuth2Client = new OAuth2Client();
    oAuth2Client.setCredentials({ access_token: accessToken });
    return oAuth2Client;
  }

  async createStudySession(accessToken, eventDetails) {
    try {
      const auth = this.createOAuth2Client(accessToken);

      const event = {
        summary: eventDetails.summary || 'Study Session',
        location: eventDetails.location,
        description: eventDetails.description || 'Study session created via Study Buddy app',
        start: {
          dateTime: eventDetails.startTime,
          timeZone: eventDetails.timeZone || 'America/New_York',
        },
        end: {
          dateTime: eventDetails.endTime,
          timeZone: eventDetails.timeZone || 'America/New_York',
        },
        attendees: eventDetails.attendees || [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
        conferenceData: eventDetails.includeConference ? {
          createRequest: {
            requestId: `study-buddy-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        } : undefined,
      };

      const response = await this.calendar.events.insert({
        auth,
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: eventDetails.includeConference ? 1 : 0,
        sendUpdates: 'all',
      });

      const userId = eventDetails.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { calendar: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.calendar) {
        await prisma.calendar.create({
          data: {
            userId,
            events: JSON.stringify([{
              googleEventId: response.data.id,
              summary: event.summary,
              startTime: event.start.dateTime,
              endTime: event.end.dateTime,
              attendees: event.attendees,
            }]),
          },
        });
      } else {
        const existingEvents = JSON.parse(user.calendar.events || '[]');
        existingEvents.push({
          googleEventId: response.data.id,
          summary: event.summary,
          startTime: event.start.dateTime,
          endTime: event.end.dateTime,
          attendees: event.attendees,
        });

        await prisma.calendar.update({
          where: { id: user.calendar.id },
          data: { events: JSON.stringify(existingEvents) },
        });
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getStudySessions(accessToken, options = {}) {
    try {
      const auth = this.createOAuth2Client(accessToken);

      const timeMin = options.timeMin || new Date().toISOString();
      const timeMax = options.timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const response = await this.calendar.events.list({
        auth,
        calendarId: 'primary',
        timeMin,
        timeMax,
        maxResults: options.maxResults || 100,
        singleEvents: true,
        orderBy: 'startTime',
        q: options.query || 'Study Session',
      });

      return response.data.items;
    } catch (error) {
      throw error;
    }
  }

  async updateStudySession(accessToken, eventId, eventDetails) {
    try {
      const auth = this.createOAuth2Client(accessToken);

      const currentEvent = await this.calendar.events.get({
        auth,
        calendarId: 'primary',
        eventId,
      });

      const updatedEvent = {
        summary: eventDetails.summary || currentEvent.data.summary,
        location: eventDetails.location || currentEvent.data.location,
        description: eventDetails.description || currentEvent.data.description,
        start: {
          dateTime: eventDetails.startTime || currentEvent.data.start.dateTime,
          timeZone: eventDetails.timeZone || currentEvent.data.start.timeZone,
        },
        end: {
          dateTime: eventDetails.endTime || currentEvent.data.end.dateTime,
          timeZone: eventDetails.timeZone || currentEvent.data.end.timeZone,
        },
        attendees: eventDetails.attendees || currentEvent.data.attendees,
      };

      const response = await this.calendar.events.update({
        auth,
        calendarId: 'primary',
        eventId,
        resource: updatedEvent,
        sendUpdates: 'all',
      });

      const userId = eventDetails.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { calendar: true },
      });

      if (user && user.calendar) {
        const existingEvents = JSON.parse(user.calendar.events || '[]');
        const updatedEvents = existingEvents.map(event => {
          if (event.googleEventId === eventId) {
            return {
              ...event,
              summary: updatedEvent.summary,
              startTime: updatedEvent.start.dateTime,
              endTime: updatedEvent.end.dateTime,
              attendees: updatedEvent.attendees,
            };
          }
          return event;
        });

        await prisma.calendar.update({
          where: { id: user.calendar.id },
          data: { events: JSON.stringify(updatedEvents) },
        });
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteStudySession(accessToken, eventId, userId) {
    try {
      const auth = this.createOAuth2Client(accessToken);

      await this.calendar.events.delete({
        auth,
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all',
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { calendar: true },
      });

      if (user && user.calendar) {
        const existingEvents = JSON.parse(user.calendar.events || '[]');
        const updatedEvents = existingEvents.filter(event => event.googleEventId !== eventId);

        await prisma.calendar.update({
          where: { id: user.calendar.id },
          data: { events: JSON.stringify(updatedEvents) },
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async checkAvailability(accessToken, startTime, endTime, attendeeEmails = []) {
    try {
      const auth = this.createOAuth2Client(accessToken);

      const items = [{ id: 'primary' }];
      attendeeEmails.forEach(email => {
        items.push({ id: email });
      });

      const response = await this.calendar.freebusy.query({
        auth,
        requestBody: {
          timeMin: startTime,
          timeMax: endTime,
          items,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getStudySessionById(accessToken, eventId) {
    try {
      const auth = this.createOAuth2Client(accessToken);

      const response = await this.calendar.events.get({
        auth,
        calendarId: 'primary',
        eventId,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CalendarService();
