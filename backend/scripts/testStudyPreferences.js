const { PrismaClient } = require('../generated/prisma');
const studyPreferencesService = require('../services/studyPreferencesService');
const checkTestUsers = require('./checkTestUsers');
const prisma = new PrismaClient();

async function createTestUsers() {
  const existingUsers = await checkTestUsers();

  if (existingUsers && Object.keys(existingUsers).length >= 7) {
    console.log('Using existing test users');
    return {
      user1: existingUsers.user1,
      user2: existingUsers.user2,
      user3: existingUsers.user3,
      user4: existingUsers.user4,
      user5: existingUsers.user5,
      user6: existingUsers.user6,
      user7: existingUsers.user7
    };
  }

  console.log('Creating new test users and their study preferences...');

  const testUser1 = await prisma.user.create({
    data: {
      email: 'test-study-user1@example.com',
      password: 'password123',
      name: 'Morning Weekday User',
      bio: 'Prefers mornings on weekdays'
    }
  });

  const testUser2 = await prisma.user.create({
    data: {
      email: 'test-study-user2@example.com',
      password: 'password123',
      name: 'Afternoon Weekday User',
      bio: 'Prefers afternoons on weekdays'
    }
  });

  const testUser3 = await prisma.user.create({
    data: {
      email: 'test-study-user3@example.com',
      password: 'password123',
      name: 'Evening & Weekend User',
      bio: 'Prefers evenings and weekends'
    }
  });

  const testUser4 = await prisma.user.create({
    data: {
      email: 'test-study-user4@example.com',
      password: 'password123',
      name: 'Weekend Only User',
      bio: 'Only available on weekends'
    }
  });

  const testUser5 = await prisma.user.create({
    data: {
      email: 'test-study-user5@example.com',
      password: 'password123',
      name: 'Limited Availability User',
      bio: 'Very limited availability'
    }
  });

  const testUser6 = await prisma.user.create({
    data: {
      email: 'test-study-user6@example.com',
      password: 'password123',
      name: 'Night Owl User',
      bio: 'Prefers late night study sessions'
    }
  });

  const testUser7 = await prisma.user.create({
    data: {
      email: 'test-study-user7@example.com',
      password: 'password123',
      name: 'Always Available User',
      bio: 'Available almost any time'
    }
  });

  console.log('Created test users');

  await prisma.studyPreferences.create({
    data: {
      userId: testUser1.id,
      preferredDays: JSON.stringify(['MONDAY', 'WEDNESDAY', 'FRIDAY']),
      preferredTimeRanges: JSON.stringify([
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '15:00' }
      ]),
      preferBackToBack: true,
      maxSessionsPerWeek: 4,
      sessionDuration: 60
    }
  });

  await prisma.studyPreferences.create({
    data: {
      userId: testUser2.id,
      preferredDays: JSON.stringify(['MONDAY', 'TUESDAY', 'THURSDAY', 'FRIDAY']),
      preferredTimeRanges: JSON.stringify([
        { start: '12:00', end: '17:00' }
      ]),
      preferBackToBack: false,
      maxSessionsPerWeek: 3,
      sessionDuration: 90
    }
  });

  await prisma.studyPreferences.create({
    data: {
      userId: testUser3.id,
      preferredDays: JSON.stringify(['TUESDAY', 'THURSDAY', 'SATURDAY', 'SUNDAY']),
      preferredTimeRanges: JSON.stringify([
        { start: '18:00', end: '22:00' },
        { start: '10:00', end: '15:00' }
      ]),
      preferBackToBack: true,
      maxSessionsPerWeek: 5,
      sessionDuration: 45
    }
  });

  await prisma.studyPreferences.create({
    data: {
      userId: testUser4.id,
      preferredDays: JSON.stringify(['SATURDAY', 'SUNDAY']),
      preferredTimeRanges: JSON.stringify([
        { start: '09:00', end: '18:00' }
      ]),
      preferBackToBack: false,
      maxSessionsPerWeek: 2,
      sessionDuration: 120
    }
  });

  await prisma.studyPreferences.create({
    data: {
      userId: testUser5.id,
      preferredDays: JSON.stringify(['WEDNESDAY']),
      preferredTimeRanges: JSON.stringify([
        { start: '14:00', end: '16:00' }
      ]),
      preferBackToBack: false,
      maxSessionsPerWeek: 1,
      sessionDuration: 30
    }
  });

  await prisma.studyPreferences.create({
    data: {
      userId: testUser6.id,
      preferredDays: JSON.stringify(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']),
      preferredTimeRanges: JSON.stringify([
        { start: '21:00', end: '23:59' }
      ]),
      preferBackToBack: true,
      maxSessionsPerWeek: 3,
      sessionDuration: 60
    }
  });

  await prisma.studyPreferences.create({
    data: {
      userId: testUser7.id,
      preferredDays: JSON.stringify(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
      preferredTimeRanges: JSON.stringify([
        { start: '08:00', end: '22:00' }
      ]),
      preferBackToBack: true,
      maxSessionsPerWeek: 10,
      sessionDuration: 60
    }
  });

  console.log('Created study preferences for test users');

  return {
    user1: testUser1.id,
    user2: testUser2.id,
    user3: testUser3.id,
    user4: testUser4.id,
    user5: testUser5.id,
    user6: testUser6.id,
    user7: testUser7.id
  };
}

async function testCompatibleTimes(userIds) {
  console.log('\n--- Testing Compatible Study Times ---\n');

  console.log('\nTEST CASE 1: Users with partial weekday overlap');
  console.log('User 1 (Morning Weekday) + User 2 (Afternoon Weekday)');
  console.log('Expected: Perfect matches on Monday and Friday afternoons (1pm-3pm)');
  try {
    const compatibleTimes12 = await studyPreferencesService.getCompatibleStudyTimes(
      userIds.user1,
      userIds.user2
    );
    console.log('Compatible times found:', compatibleTimes12.length);
    console.log(JSON.stringify(compatibleTimes12, null, 2));
  } catch (error) {
    console.error('Error finding compatible times for User 1 and User 2:', error);
  }

  console.log('\nTEST CASE 2: Users with no common days');
  console.log('User 1 (Morning Weekday) + User 4 (Weekend Only)');
  console.log('Expected: No perfect matches, only suggestions');
  try {
    const compatibleTimes14 = await studyPreferencesService.getCompatibleStudyTimes(
      userIds.user1,
      userIds.user4
    );
    console.log('Compatible times found:', compatibleTimes14.length);
    console.log(JSON.stringify(compatibleTimes14, null, 2));
  } catch (error) {
    console.error('Error finding compatible times for User 1 and User 4:', error);
  }

  console.log('\nTEST CASE 3: Users with very limited overlap');
  console.log('User 1 (Morning Weekday) + User 5 (Limited Availability)');
  console.log('Expected: One perfect match on Wednesday 2pm-3pm');
  try {
    const compatibleTimes15 = await studyPreferencesService.getCompatibleStudyTimes(
      userIds.user1,
      userIds.user5
    );
    console.log('Compatible times found:', compatibleTimes15.length);
    console.log(JSON.stringify(compatibleTimes15, null, 2));
  } catch (error) {
    console.error('Error finding compatible times for User 1 and User 5:', error);
  }

  console.log('\nTEST CASE 4: Users with common days but no time overlap');
  console.log('User 1 (Morning Weekday) + User 6 (Night Owl)');
  console.log('Expected: No perfect matches despite common days');
  try {
    const compatibleTimes16 = await studyPreferencesService.getCompatibleStudyTimes(
      userIds.user1,
      userIds.user6
    );
    console.log('Compatible times found:', compatibleTimes16.length);
    console.log(JSON.stringify(compatibleTimes16, null, 2));
  } catch (error) {
    console.error('Error finding compatible times for User 1 and User 6:', error);
  }

  console.log('\nTEST CASE 5: Limited availability + wide availability');
  console.log('User 5 (Limited Availability) + User 7 (Always Available)');
  console.log('Expected: Perfect matches on Wednesday 2pm-4pm');
  try {
    const compatibleTimes57 = await studyPreferencesService.getCompatibleStudyTimes(
      userIds.user5,
      userIds.user7
    );
    console.log('Compatible times found:', compatibleTimes57.length);
    console.log(JSON.stringify(compatibleTimes57, null, 2));
  } catch (error) {
    console.error('Error finding compatible times for User 5 and User 7:', error);
  }

  console.log('\nTEST CASE 6: Users with different session duration preferences');
  console.log('User 2 (90 min sessions) + User 3 (45 min sessions)');
  console.log('Expected: Compatible times with 45-minute duration');
  try {
    const compatibleTimes23 = await studyPreferencesService.getCompatibleStudyTimes(
      userIds.user2,
      userIds.user3
    );
    console.log('Compatible times found:', compatibleTimes23.length);
    console.log(JSON.stringify(compatibleTimes23, null, 2));
  } catch (error) {
    console.error('Error finding compatible times for User 2 and User 3:', error);
  }

  console.log('\nTEST CASE 7: Users who both prefer back-to-back sessions');
  console.log('User 3 (back-to-back) + User 7 (back-to-back)');
  console.log('Expected: Multiple consecutive time slots');
  try {
    const compatibleTimes37 = await studyPreferencesService.getCompatibleStudyTimes(
      userIds.user3,
      userIds.user7
    );
    console.log('Compatible times found:', compatibleTimes37.length);
    console.log(JSON.stringify(compatibleTimes37, null, 2));
  } catch (error) {
    console.error('Error finding compatible times for User 3 and User 7:', error);
  }
}

async function main() {
  try {
    console.log('Starting study preferences algorithm test...');
    const userIds = await createTestUsers();
    await testCompatibleTimes(userIds);
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
