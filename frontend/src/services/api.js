const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      if (response.status === 204) {
        return null;
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }


  async authenticateUser(firebaseId, email, name) {
    return this.request('/users/firebase-auth', {
      method: 'POST',
      body: { firebaseId, email, name },
    });
  }

  async getPotentialMatches(userId) {
    return this.request(`/users/potential-matches/${userId}`);
  }

  async getConfirmedMatches(userId) {
    return this.request(`/users/confirmed-matches/${userId}`);
  }

  async getCourses() {
    return this.request('/courses');
  }

  async getUserCourses(userId) {
    return this.request(`/user-courses/${userId}`);
  }

  async addUserCourse(userId, courseId, proficiency = 1) {
    return this.request('/user-courses', {
      method: 'POST',
      body: { userId, courseId, proficiency },
    });
  }

  async updateUserCourseProficiency(userId, courseId, proficiency) {
    return this.request(`/user-courses/${userId}/${courseId}`, {
      method: 'PUT',
      body: { proficiency },
    });
  }

  async removeUserCourse(userId, courseId) {
    return this.request(`/user-courses/${userId}/${courseId}`, {
      method: 'DELETE',
    });
  }

  async createMatch(user1Id, user2Id) {
    return this.request('/users/matches', {
      method: 'POST',
      body: { user1Id, user2Id },
    });
  }

  async createRating(userId, partnerId, score) {
    return this.request('/users/ratings', {
      method: 'POST',
      body: { userId, partnerId, score },
    });
  }

  async getUserRatings(userId) {
    return this.request(`/users/ratings/${userId}`);
  }

  async getSpecificRating(userId, partnerId) {
    return this.request(`/users/ratings/${userId}/${partnerId}`);
  }

  async createMatchRequest(senderId, receiverId) {
    return this.request('/users/match-requests', {
      method: 'POST',
      body: { senderId, receiverId },
    });
  }

  async getMatchRequests(userId) {
    return this.request(`/users/match-requests/${userId}`);
  }

  async respondToMatchRequest(requestId, status) {
    return this.request(`/users/match-requests/${requestId}`, {
      method: 'PUT',
      body: { status },
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/users/update/${userId}`, {
      method: 'PUT',
      body: userData,
    });
  }
}

export default new ApiService();
