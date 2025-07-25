const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function getStudyPreferences(userId) {
  return prisma.studyPreferences.findUnique({
    where: { userId: parseInt(userId) }
  });
}

async function createOrUpdateStudyPreferences(userId, preferencesData) {
  const {
    preferredDays,
    preferredTimeRanges,
    preferBackToBack,
    maxSessionsPerWeek,
    sessionDuration,
    weightCourseOverlap,
    weightProficiencyBalance,
    weightUserRating
  } = preferencesData;

  return prisma.studyPreferences.upsert({
    where: { userId: parseInt(userId) },
    update: {
      preferredDays: JSON.stringify(preferredDays),
      preferredTimeRanges: JSON.stringify(preferredTimeRanges),
      preferBackToBack,
      maxSessionsPerWeek,
      sessionDuration,
      weightCourseOverlap: weightCourseOverlap !== undefined ? weightCourseOverlap : 0.50,
      weightProficiencyBalance: weightProficiencyBalance !== undefined ? weightProficiencyBalance : 0.30,
      weightUserRating: weightUserRating !== undefined ? weightUserRating : 0.20
    },
    create: {
      userId: parseInt(userId),
      preferredDays: JSON.stringify(preferredDays),
      preferredTimeRanges: JSON.stringify(preferredTimeRanges),
      preferBackToBack,
      maxSessionsPerWeek,
      sessionDuration,
      weightCourseOverlap: weightCourseOverlap !== undefined ? weightCourseOverlap : 0.50,
      weightProficiencyBalance: weightProficiencyBalance !== undefined ? weightProficiencyBalance : 0.30,
      weightUserRating: weightUserRating !== undefined ? weightUserRating : 0.20
    }
  });
}

async function getCompatibleStudyTimes(userId1, userId2) {
  const user1Prefs = await getStudyPreferences(userId1);
  const user2Prefs = await getStudyPreferences(userId2);

  if (!user1Prefs || !user2Prefs) throw new Error('Study preferences not found for one or both users');

  const user1Days = JSON.parse(user1Prefs.preferredDays);
  const user2Days = JSON.parse(user2Prefs.preferredDays);
  const user1TimeRanges = JSON.parse(user1Prefs.preferredTimeRanges);
  const user2TimeRanges = JSON.parse(user2Prefs.preferredTimeRanges);

  const sessionDuration = Math.min(user1Prefs.sessionDuration || 60, user2Prefs.sessionDuration || 60);
  const preferBackToBack = user1Prefs.preferBackToBack && user2Prefs.preferBackToBack;

  const daysMap = {
    MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4,
    FRIDAY: 5, SATURDAY: 6, SUNDAY: 0
  };

  const now = new Date();
  const currentDay = now.getDay();

  const commonDays = user1Days.filter(day => user2Days.includes(day));
  const user1UniqueDays = user1Days.filter(day => !commonDays.includes(day));
  const user2UniqueDays = user2Days.filter(day => !commonDays.includes(day));

  const overlappingRanges = findOverlappingTimeRanges(user1TimeRanges, user2TimeRanges);
  const perfectMatches = buildPerfectMatches(commonDays, overlappingRanges, now, sessionDuration, preferBackToBack, daysMap);

  if (perfectMatches.length > 0) {
    return perfectMatches.map(match => ({
      start: match.start.toISOString(),
      end: match.end.toISOString(),
      day: match.day,
      perfectMatch: true
    })).slice(0, 3);
  }

  const suggestedTimes = [];
  if (suggestedTimes.length < 3) suggestedTimes.push(...buildSuggestedTimes(user1TimeRanges, commonDays, now, sessionDuration, daysMap, currentDay, 3 - suggestedTimes.length, 'Common day using user1 time'));
  if (suggestedTimes.length < 3) suggestedTimes.push(...buildSuggestedTimes(user1TimeRanges, user1UniqueDays, now, sessionDuration, daysMap, currentDay, 3 - suggestedTimes.length, 'User1 unique day'));
  if (suggestedTimes.length < 3) suggestedTimes.push(...buildSuggestedTimes(user1TimeRanges, user2UniqueDays, now, sessionDuration, daysMap, currentDay, 3 - suggestedTimes.length, 'User2 unique day'));

  return suggestedTimes.slice(0, 3);
}

function findOverlappingTimeRanges(ranges1, ranges2) {
  const convertToMinutes = t => t.split(':').map(Number).reduce((h, m) => h * 60 + m);
  const formatTime = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  const r1 = ranges1.map(r => ({ start: convertToMinutes(r.start), end: convertToMinutes(r.end) })).sort((a, b) => a.start - b.start);
  const r2 = ranges2.map(r => ({ start: convertToMinutes(r.start), end: convertToMinutes(r.end) })).sort((a, b) => a.start - b.start);

  const overlaps = [];
  let i = 0, j = 0;
  while (i < r1.length && j < r2.length) {
    const start = Math.max(r1[i].start, r2[j].start);
    const end = Math.min(r1[i].end, r2[j].end);
    if (start < end) overlaps.push({ start: formatTime(start), end: formatTime(end) });
    r1[i].end < r2[j].end ? i++ : j++;
  }
  return overlaps;
}

function buildPerfectMatches(commonDays, ranges, now, duration, backToBack, daysMap) {
  const matches = [];
  const currentDay = now.getDay();

  for (const day of commonDays) {
    for (let weekOffset = 0; weekOffset < 2; weekOffset++) {
      const daysToAdd = ((daysMap[day] - currentDay + 7) % 7) + (weekOffset * 7);
      const date = new Date(now);
      date.setDate(now.getDate() + daysToAdd);

      for (const range of ranges) {
        const [h1, m1] = range.start.split(':').map(Number);
        const [h2, m2] = range.end.split(':').map(Number);

        const start = new Date(date);
        start.setHours(h1, m1, 0, 0);

        const end = new Date(date);
        end.setHours(h2, m2, 0, 0);

        if (start < now) continue;

        const available = end - start;
        const required = duration * 60 * 1000;

        if (available >= required) {
          const endTime = new Date(start.getTime() + required);
          matches.push({ start, end: endTime, day });

          if (backToBack && available >= required * 2) {
            const secondStart = new Date(endTime);
            const secondEnd = new Date(secondStart.getTime() + required);
            if (secondEnd <= end) {
              matches.push({ start: secondStart, end: secondEnd, day });
            }
          }
        }
      }
    }
  }

  matches.sort((a, b) => daysMap[a.day] - daysMap[b.day] || a.start - b.start);
  return matches;
}

function buildSuggestedTimes(ranges, days, now, duration, daysMap, currentDay, limit = 3, label = '') {
  const results = [];

  const sortedDays = [...days].sort((a, b) => {
    const daysUntilA = (daysMap[a] - currentDay + 7) % 7;
    const daysUntilB = (daysMap[b] - currentDay + 7) % 7;
    return daysUntilA - daysUntilB;
  });

  for (const day of sortedDays) {
    if (results.length >= limit) break;

    const dayNumber = daysMap[day];
    const daysToAdd = (dayNumber - currentDay + 7) % 7;
    const sessionDate = new Date(now);
    sessionDate.setDate(now.getDate() + daysToAdd);

    for (const range of ranges) {
      if (results.length >= limit) break;

      const [startHour, startMinute] = range.start.split(':').map(Number);
      const [endHour, endMinute] = range.end.split(':').map(Number);

      const startTime = new Date(sessionDate);
      startTime.setHours(startHour, startMinute, 0, 0);

      const endTime = new Date(sessionDate);
      endTime.setHours(endHour, endMinute, 0, 0);

      const durationMs = duration * 60 * 1000;
      const availableMs = endTime - startTime;

      if (startTime >= now && availableMs >= durationMs) {
        results.push({
          start: startTime.toISOString(),
          end: new Date(startTime.getTime() + durationMs).toISOString(),
          day,
          perfectMatch: false,
          reason: label
        });
      }
    }
  }

  return results;
}

module.exports = {
  getStudyPreferences,
  createOrUpdateStudyPreferences,
  getCompatibleStudyTimes
};
