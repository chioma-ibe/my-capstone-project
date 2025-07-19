import api from './api';

const calendarClient = {
  createStudySession: async (accessToken, sessionDetails) => {
    return api.request('/calendar/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: {
        ...sessionDetails
      }
    });
  },

  getStudySessions: async (accessToken, options = {}) => {
    const { timeMin, timeMax, maxResults, query } = options;
    const queryParams = new URLSearchParams();

    if (timeMin) queryParams.append('timeMin', timeMin);
    if (timeMax) queryParams.append('timeMax', timeMax);
    if (maxResults) queryParams.append('maxResults', maxResults);
    if (query) queryParams.append('query', query);

    const queryString = queryParams.toString();
    const url = queryString ? `/calendar/sessions?${queryString}` : '/calendar/sessions';

    return api.request(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
  },

  getStudySession: async (accessToken, eventId) => {
    return api.request(`/calendar/sessions/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
  },

  updateStudySession: async (accessToken, eventId, updates) => {
    return api.request(`/calendar/sessions/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: {
        ...updates
      }
    });
  },

  deleteStudySession: async (accessToken, eventId, userId) => {
    return api.request(`/calendar/sessions/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: { userId }
    });
  },

  checkAvailability: async (accessToken, startTime, endTime, attendeeEmails = []) => {
    return api.request('/calendar/availability', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: {
        startTime,
        endTime,
        attendeeEmails
      }
    });
  }
};

export default calendarClient;
