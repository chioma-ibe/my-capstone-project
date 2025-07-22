const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function checkTestUsers() {
  try {
    console.log('Checking for existing test users...');

    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'test-study-'
        }
      },
      include: {
        studyPreferences: true
      }
    });

    if (testUsers.length > 0) {
      console.log(`Found ${testUsers.length} existing test users:`);

      for (const user of testUsers) {
        console.log(`- User ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);

        if (user.studyPreferences) {
          console.log(`  Has study preferences:
            Days: ${JSON.parse(user.studyPreferences.preferredDays)}
            Time Ranges: ${JSON.parse(user.studyPreferences.preferredTimeRanges)}
            Session Duration: ${user.studyPreferences.sessionDuration} minutes
          `);
        } else {
          console.log('  No study preferences found');
        }
      }

      const userIds = {};
      if (testUsers.length >= 1) userIds.user1 = testUsers[0].id;
      if (testUsers.length >= 2) userIds.user2 = testUsers[1].id;
      if (testUsers.length >= 3) userIds.user3 = testUsers[2].id;
      if (testUsers.length >= 4) userIds.user4 = testUsers[3].id;
      if (testUsers.length >= 5) userIds.user5 = testUsers[4].id;
      if (testUsers.length >= 6) userIds.user6 = testUsers[5].id;
      if (testUsers.length >= 7) userIds.user7 = testUsers[6].id;

      return userIds;
    } else {
      console.log('No existing test users found');
      return null;
    }
  } catch (error) {
    console.error('Error checking for test users:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkTestUsers()
    .then(userIds => {
      if (userIds) {
        console.log('Test user IDs:', userIds);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = checkTestUsers;
