import api from './api';

const calendarService = {
  createStudySession: async (accessToken, sessionDetails) => {
    const response = await api.post('/calendar/sessions', {
      accessToken,
      ...sessionDetails
    });
    return response.data;
  },

  getStudySessions: async (accessToken, options = {}) => {
    const response = await api.get('/calendar/sessions', {
      params: { accessToken, ...options }
    });
    return response.data;
  },

  getStudySession: async (accessToken, eventId) => {
    const response = await api.get(`/calendar/sessions/${eventId}`, {
      params: { accessToken }
    });
    return response.data;
  },

  updateStudySession: async (accessToken, eventId, updates) => {
    const response = await api.put(`/calendar/sessions/${eventId}`, {
      accessToken,
      ...updates
    });
    return response.data;
  },

  deleteStudySession: async (accessToken, eventId, userId) => {
    await api.delete(`/calendar/sessions/${eventId}`, {
      data: { accessToken, userId }
    });
  },

  checkAvailability: async (accessToken, startTime, endTime, attendeeEmails = []) => {
    const response = await api.post('/calendar/availability', {
      accessToken,
      startTime,
      endTime,
      attendeeEmails
    });
    return response.data;
  }
};

export default calendarService;
