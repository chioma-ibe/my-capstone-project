const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function getStudyPreferences(userId) {
  return prisma.studyPreferences.findUnique({
    where: { userId: parseInt(userId) }
  });
}

async function createOrUpdateStudyPreferences(userId, preferencesData) {
  const { preferredDays, preferredTimeRanges, preferBackToBack, maxSessionsPerWeek, sessionDuration } = preferencesData;

  return prisma.studyPreferences.upsert({
    where: { userId: parseInt(userId) },
    update: {
      preferredDays: JSON.stringify(preferredDays),
      preferredTimeRanges: JSON.stringify(preferredTimeRanges),
      preferBackToBack,
      maxSessionsPerWeek,
      sessionDuration
    },
    create: {
      userId: parseInt(userId),
      preferredDays: JSON.stringify(preferredDays),
      preferredTimeRanges: JSON.stringify(preferredTimeRanges),
      preferBackToBack,
      maxSessionsPerWeek,
      sessionDuration
    }
  });
}


async function getCompatibleStudyTimes(userId1, userId2) {
  const user1Prefs = await getStudyPreferences(userId1);
  const user2Prefs = await getStudyPreferences(userId2);

  if (!user1Prefs || !user2Prefs) {
    throw new Error('Study preferences not found for one or both users');
  }

  const user1Days = JSON.parse(user1Prefs.preferredDays);
  const user2Days = JSON.parse(user2Prefs.preferredDays);
  const user1TimeRanges = JSON.parse(user1Prefs.preferredTimeRanges);
  const user2TimeRanges = JSON.parse(user2Prefs.preferredTimeRanges);

  const sessionDuration = Math.min(
    user1Prefs.sessionDuration || 60,
    user2Prefs.sessionDuration || 60
  );

  const preferBackToBack = user1Prefs.preferBackToBack && user2Prefs.preferBackToBack;

  const daysMap = {
    'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3, 'THURSDAY': 4,
    'FRIDAY': 5, 'SATURDAY': 6, 'SUNDAY': 0
  };

  const now = new Date();
  const currentDay = now.getDay();

  const commonDays = user1Days.filter(day => user2Days.includes(day));

  const overlappingRanges = [];
  for (const range1 of user1TimeRanges) {
    for (const range2 of user2TimeRanges) {
      const start1 = range1.start;
      const end1 = range1.end;
      const start2 = range2.start;
      const end2 = range2.end;

      if (start1 <= end2 && start2 <= end1) {
        const overlapStart = start1 > start2 ? start1 : start2;
        const overlapEnd = end1 < end2 ? end1 : end2;

        overlappingRanges.push({
          start: overlapStart,
          end: overlapEnd,
          perfectMatch: true
        });
      }
    }
  }

  const perfectMatches = [];
  if (commonDays.length > 0 && overlappingRanges.length > 0) {
    const sortedDays = [...commonDays].sort((a, b) => {
      const dayA = daysMap[a];
      const dayB = daysMap[b];

      const daysUntilA = (dayA - currentDay + 7) % 7;
      const daysUntilB = (dayB - currentDay + 7) % 7;

      return daysUntilA - daysUntilB;
    });

    let sessionsAdded = 0;
    let dayIndex = 0;

    while (sessionsAdded < 3 && dayIndex < sortedDays.length) {
      const day = sortedDays[dayIndex];
      const dayNumber = daysMap[day];

      const daysToAdd = (dayNumber - currentDay + 7) % 7;
      const sessionDate = new Date(now);
      sessionDate.setDate(now.getDate() + daysToAdd);

      const sortedRanges = [...overlappingRanges].sort((a, b) => {
        return a.start.localeCompare(b.start);
      });

      for (const range of sortedRanges) {
        if (sessionsAdded >= 3) break;

        const [startHour, startMinute] = range.start.split(':').map(Number);
        const [endHour, endMinute] = range.end.split(':').map(Number);

        const startTime = new Date(sessionDate);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(sessionDate);
        endTime.setHours(endHour, endMinute, 0, 0);

        if (startTime < now) continue;

        const durationMs = sessionDuration * 60 * 1000;
        const availableMs = endTime - startTime;

        if (availableMs >= durationMs) {
          const optimalStart = new Date(startTime);
          const optimalEnd = new Date(optimalStart);
          optimalEnd.setMinutes(optimalStart.getMinutes() + sessionDuration);

          perfectMatches.push({
            start: optimalStart,
            end: optimalEnd,
            day,
            perfectMatch: true
          });

          sessionsAdded++;

          if (preferBackToBack && availableMs >= durationMs * 2 && sessionsAdded < 3) {
            const secondStart = new Date(optimalEnd);
            const secondEnd = new Date(secondStart);
            secondEnd.setMinutes(secondStart.getMinutes() + sessionDuration);

            if (secondEnd <= endTime) {
              perfectMatches.push({
                start: secondStart,
                end: secondEnd,
                day,
                perfectMatch: true
              });
              sessionsAdded++;
            }
          }
        }
      }

      dayIndex++;
    }
  }

  if (perfectMatches.length > 0) {
    return perfectMatches.slice(0, 3).map(time => ({
      start: time.start.toISOString(),
      end: time.end.toISOString(),
      day: time.day,
      perfectMatch: true
    }));
  }

  const suggestedTimes = [];

  if (commonDays.length > 0) {
    const sortedDays = [...commonDays].sort((a, b) => {
      const dayA = daysMap[a];
      const dayB = daysMap[b];

      const daysUntilA = (dayA - currentDay + 7) % 7;
      const daysUntilB = (dayB - currentDay + 7) % 7;

      return daysUntilA - daysUntilB;
    });

    for (const day of sortedDays) {
      if (suggestedTimes.length >= 3) break;

      const dayNumber = daysMap[day];
      const daysToAdd = (dayNumber - currentDay + 7) % 7;
      const sessionDate = new Date(now);
      sessionDate.setDate(now.getDate() + daysToAdd);

      for (const range of user1TimeRanges) {
        if (suggestedTimes.length >= 3) break;

        const [startHour, startMinute] = range.start.split(':').map(Number);
        const [endHour, endMinute] = range.end.split(':').map(Number);

        const startTime = new Date(sessionDate);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(sessionDate);
        endTime.setHours(endHour, endMinute, 0, 0);

        if (startTime < now) continue;

        const durationMs = sessionDuration * 60 * 1000;
        const availableMs = endTime - startTime;

        if (availableMs >= durationMs) {
          suggestedTimes.push({
            start: startTime.toISOString(),
            end: new Date(startTime.getTime() + durationMs).toISOString(),
            day,
            perfectMatch: false,
            reason: "Common day but using your preferred time"
          });
        }
      }
    }
  }
  if (suggestedTimes.length < 3) {
    const sortedDays = [...user1Days].sort((a, b) => {
      const dayA = daysMap[a];
      const dayB = daysMap[b];

      const daysUntilA = (dayA - currentDay + 7) % 7;
      const daysUntilB = (dayB - currentDay + 7) % 7;

      return daysUntilA - daysUntilB;
    });

    for (const day of sortedDays) {
      if (suggestedTimes.length >= 3) break;

      if (commonDays.includes(day)) continue;

      const dayNumber = daysMap[day];
      const daysToAdd = (dayNumber - currentDay + 7) % 7;
      const sessionDate = new Date(now);
      sessionDate.setDate(now.getDate() + daysToAdd);

      for (const range of user1TimeRanges) {
        if (suggestedTimes.length >= 3) break;

        const [startHour, startMinute] = range.start.split(':').map(Number);
        const [endHour, endMinute] = range.end.split(':').map(Number);

        const startTime = new Date(sessionDate);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(sessionDate);
        endTime.setHours(endHour, endMinute, 0, 0);

        if (startTime < now) continue;

        const durationMs = sessionDuration * 60 * 1000;
        const availableMs = endTime - startTime;

        if (availableMs >= durationMs) {
          suggestedTimes.push({
            start: startTime.toISOString(),
            end: new Date(startTime.getTime() + durationMs).toISOString(),
            day,
            perfectMatch: false,
          });
        }
      }
    }
  }

  if (suggestedTimes.length < 3) {
    const sortedDays = [...user2Days].sort((a, b) => {
      const dayA = daysMap[a];
      const dayB = daysMap[b];

      const daysUntilA = (dayA - currentDay + 7) % 7;
      const daysUntilB = (dayB - currentDay + 7) % 7;

      return daysUntilA - daysUntilB;
    });

    for (const day of sortedDays) {
      if (suggestedTimes.length >= 3) break;

      if (commonDays.includes(day)) continue;

      const dayNumber = daysMap[day];
      const daysToAdd = (dayNumber - currentDay + 7) % 7;
      const sessionDate = new Date(now);
      sessionDate.setDate(now.getDate() + daysToAdd);

      for (const range of user1TimeRanges) {
        if (suggestedTimes.length >= 3) break;

        const [startHour, startMinute] = range.start.split(':').map(Number);
        const [endHour, endMinute] = range.end.split(':').map(Number);

        const startTime = new Date(sessionDate);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(sessionDate);
        endTime.setHours(endHour, endMinute, 0, 0);

        if (startTime < now) continue;

        const durationMs = sessionDuration * 60 * 1000;
        const availableMs = endTime - startTime;

        if (availableMs >= durationMs) {
          suggestedTimes.push({
            start: startTime.toISOString(),
            end: new Date(startTime.getTime() + durationMs).toISOString(),
            day,
            perfectMatch: false,
          });
        }
      }
    }
  }

  return suggestedTimes.slice(0, 3);
}

module.exports = {
  getStudyPreferences,
  createOrUpdateStudyPreferences,
  getCompatibleStudyTimes
};
