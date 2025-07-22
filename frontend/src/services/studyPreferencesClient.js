import ApiService from './api';

class StudyPreferencesClient {
  async getStudyPreferences(userId) {
    return ApiService.request(`/study-preferences/${userId}`);
  }

  async saveStudyPreferences(userId, preferences) {
    return ApiService.request(`/study-preferences/${userId}`, {
      method: 'POST',
      body: preferences
    });
  }

  async getCompatibleStudyTimes(userId1, userId2) {
    return ApiService.request(`/study-preferences/${userId1}/compatible-times/${userId2}`);
  }
}

export default new StudyPreferencesClient();
