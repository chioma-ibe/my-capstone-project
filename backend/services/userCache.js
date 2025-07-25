const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

class UserCache {
  getPotentialMatches(userId) {
    const key = `potential_matches_${userId}`;
    return cache.get(key);
  }

  setPotentialMatches(userId, matches, ttl = 300) {
    const key = `potential_matches_${userId}`;
    cache.set(key, matches, ttl);
  }

  invalidatePotentialMatches(userId) {
    const key = `potential_matches_${userId}`;
    cache.del(key);
  }

  getCourses() {
    return cache.get('all_courses');
  }

  setCourses(courses, ttl = 3600) {
    cache.set('all_courses', courses, ttl);
  }

  invalidateCourses() {
    cache.del('all_courses');
  }

  getUserCourses(userId) {
    const key = `user_courses_${userId}`;
    return cache.get(key);
  }

  setUserCourses(userId, courses, ttl = 300) {
    const key = `user_courses_${userId}`;
    cache.set(key, courses, ttl);
  }

  invalidateUserCourses(userId) {
    const key = `user_courses_${userId}`;
    cache.del(key);
  }

  flushAll() {
    cache.flushAll();
  }
}

module.exports = new UserCache();
