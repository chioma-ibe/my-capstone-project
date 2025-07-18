import api from './api';

const calendarClient = {
  createStudySession: async (accessToken, sessionDetails) => {
    return api.request('/calendar/sessions', {
      method: 'POST',
      body: {
        accessToken,
        ...sessionDetails
      }
    });
  },

  getStudySessions: async (accessToken, options = {}) => {
    const queryParams = new URLSearchParams({ accessToken, ...options }).toString();
    return api.request(`/calendar/sessions?${queryParams}`);
  },

  getStudySession: async (accessToken, eventId) => {
    const queryParams = new URLSearchParams({ accessToken }).toString();
    return api.request(`/calendar/sessions/${eventId}?${queryParams}`);
  },

  updateStudySession: async (accessToken, eventId, updates) => {
    return api.request(`/calendar/sessions/${eventId}`, {
      method: 'PUT',
      body: {
        accessToken,
        ...updates
      }
    });
  },

  deleteStudySession: async (accessToken, eventId, userId) => {
    return api.request(`/calendar/sessions/${eventId}`, {
      method: 'DELETE',
      body: { accessToken, userId }
    });
  },

  checkAvailability: async (accessToken, startTime, endTime, attendeeEmails = []) => {
    return api.request('/calendar/availability', {
      method: 'POST',
      body: {
        accessToken,
        startTime,
        endTime,
        attendeeEmails
      }
    });
  }
};

export default calendarClient;
