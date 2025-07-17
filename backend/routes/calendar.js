const express = require('express');
const router = express.Router();
const calendarService = require('../services/calendarService');

router.post('/sessions', async (req, res) => {
  try {
    const {
      accessToken,
      userId,
      startTime,
      endTime,
      summary,
      description,
      location,
      attendees,
      timeZone,
      includeConference
    } = req.body;

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token is required' });
    }

    if (!userId || !startTime || !endTime) {
      return res.status(400).json({
        error: 'User ID, start time, and end time are required'
      });
    }

    const eventDetails = {
      userId: parseInt(userId),
      startTime,
      endTime,
      summary,
      description,
      location,
      attendees,
      timeZone,
      includeConference
    };

    const createdEvent = await calendarService.createStudySession(
      accessToken,
      eventDetails
    );

    res.status(201).json(createdEvent);
  } catch (error) {
    console.error('Error creating study session:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    if (error.code === 401 || error.code === 403) {
      return res.status(401).json({
        error: 'Authentication failed. Please sign in again.'
      });
    }

    res.status(500).json({
      error: 'Failed to create study session',
      details: error.message
    });
  }
});

router.get('/sessions', async (req, res) => {
  try {
    const { accessToken, timeMin, timeMax, maxResults, query } = req.query;

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token is required' });
    }

    const options = {
      timeMin,
      timeMax,
      maxResults: maxResults ? parseInt(maxResults) : undefined,
      query
    };

    const events = await calendarService.getStudySessions(accessToken, options);
    res.json(events);
  } catch (error) {
    console.error('Error getting study sessions:', error);

    if (error.code === 401 || error.code === 403) {
      return res.status(401).json({
        error: 'Authentication failed. Please sign in again.'
      });
    }

    res.status(500).json({
      error: 'Failed to get study sessions',
      details: error.message
    });
  }
});

router.get('/sessions/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token is required' });
    }

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const event = await calendarService.getStudySessionById(accessToken, eventId);
    res.json(event);
  } catch (error) {
    console.error('Error getting study session:', error);

    if (error.code === 401 || error.code === 403) {
      return res.status(401).json({
        error: 'Authentication failed. Please sign in again.'
      });
    }

    if (error.code === 404) {
      return res.status(404).json({ error: 'Study session not found' });
    }

    res.status(500).json({
      error: 'Failed to get study session',
      details: error.message
    });
  }
});

router.put('/sessions/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      accessToken,
      userId,
      startTime,
      endTime,
      summary,
      description,
      location,
      attendees,
      timeZone
    } = req.body;

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const eventDetails = {
      userId: parseInt(userId)
    };

    if (startTime) eventDetails.startTime = startTime;
    if (endTime) eventDetails.endTime = endTime;
    if (summary) eventDetails.summary = summary;
    if (description) eventDetails.description = description;
    if (location) eventDetails.location = location;
    if (attendees) eventDetails.attendees = attendees;
    if (timeZone) eventDetails.timeZone = timeZone;

    const updatedEvent = await calendarService.updateStudySession(
      accessToken,
      eventId,
      eventDetails
    );

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating study session:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    if (error.code === 401 || error.code === 403) {
      return res.status(401).json({
        error: 'Authentication failed. Please sign in again.'
      });
    }

    if (error.code === 404) {
      return res.status(404).json({ error: 'Study session not found' });
    }

    res.status(500).json({
      error: 'Failed to update study session',
      details: error.message
    });
  }
});

router.delete('/sessions/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { accessToken, userId } = req.body;

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await calendarService.deleteStudySession(
      accessToken,
      eventId,
      parseInt(userId)
    );

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting study session:', error);

    if (error.code === 401 || error.code === 403) {
      return res.status(401).json({
        error: 'Authentication failed. Please sign in again.'
      });
    }

    if (error.code === 404) {
      return res.status(404).json({ error: 'Study session not found' });
    }

    res.status(500).json({
      error: 'Failed to delete study session',
      details: error.message
    });
  }
});

router.post('/availability', async (req, res) => {
  try {
    const { accessToken, startTime, endTime, attendeeEmails } = req.body;

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token is required' });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({
        error: 'Start time and end time are required'
      });
    }

    const availability = await calendarService.checkAvailability(
      accessToken,
      startTime,
      endTime,
      attendeeEmails
    );

    res.json(availability);
  } catch (error) {
    console.error('Error checking availability:', error);

    if (error.code === 401 || error.code === 403) {
      return res.status(401).json({
        error: 'Authentication failed. Please sign in again.'
      });
    }

    res.status(500).json({
      error: 'Failed to check availability',
      details: error.message
    });
  }
});

module.exports = router;
