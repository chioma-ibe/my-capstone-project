const { PrismaClient } = require('../generated/prisma');
const checkTestUsers = require('./checkTestUsers');
const prisma = new PrismaClient();

function convertTimeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return (hours * 60) + minutes;
}

async function setupTestData() {
  console.log('Setting up test data...');

  const users = await checkTestUsers();
  if (!users || Object.keys(users).length < 7) {
    console.log('Test users not found. Please run testStudyPreferences.js first.');
    return null;
  }

  const courses = await createTestCourses();
  await assignCoursesToUsers(users, courses);
  await clearExistingMatches(users);

  await prisma.matchRequest.create({
    data: {
      senderId: users.user3,
      receiverId: users.user1,
      status: 'PENDING'
    }
  });

  console.log('Created pending match request from user3 to user1');

  return users;
}

async function createTestCourses() {
  const courses = [
    { name: 'Mathematics 101', description: 'Basic mathematics course' },
    { name: 'Computer Science 101', description: 'Introduction to computer science' },
    { name: 'Physics 101', description: 'Basic physics principles' },
    { name: 'Chemistry 101', description: 'Introduction to chemistry' },
    { name: 'Biology 101', description: 'Introduction to biology' }
  ];

  const createdCourses = [];

  for (const course of courses) {
    let existingCourse = await prisma.course.findUnique({
      where: { name: course.name }
    });

    if (!existingCourse) {
      existingCourse = await prisma.course.create({ data: course });
    }

    createdCourses.push(existingCourse);
  }

  return createdCourses;
}

async function assignCoursesToUsers(users, courses) {
  for (const userId of Object.values(users)) {
    await prisma.userCourse.deleteMany({ where: { userId } });
  }

  await prisma.userCourse.create({
    data: { userId: users.user1, courseId: courses[0].id, proficiency: 3 }
  });
  await prisma.userCourse.create({
    data: { userId: users.user1, courseId: courses[1].id, proficiency: 2 }
  });

  await prisma.userCourse.create({
    data: { userId: users.user2, courseId: courses[0].id, proficiency: 2 }
  });
  await prisma.userCourse.create({
    data: { userId: users.user2, courseId: courses[2].id, proficiency: 3 }
  });

  await prisma.userCourse.create({
    data: { userId: users.user3, courseId: courses[1].id, proficiency: 4 }
  });
  await prisma.userCourse.create({
    data: { userId: users.user3, courseId: courses[2].id, proficiency: 2 }
  });

  await prisma.userCourse.create({
    data: { userId: users.user4, courseId: courses[3].id, proficiency: 3 }
  });
  await prisma.userCourse.create({
    data: { userId: users.user4, courseId: courses[4].id, proficiency: 3 }
  });

  await prisma.userCourse.create({
    data: { userId: users.user5, courseId: courses[0].id, proficiency: 1 }
  });

  await prisma.userCourse.create({
    data: { userId: users.user6, courseId: courses[1].id, proficiency: 5 }
  });

  for (let i = 0; i < courses.length; i++) {
    await prisma.userCourse.create({
      data: { userId: users.user7, courseId: courses[i].id, proficiency: 3 }
    });
  }
}

async function clearExistingMatches(users) {
  const userIds = Object.values(users);

  await prisma.match.deleteMany({
    where: {
      OR: [
        { user1Id: { in: userIds } },
        { user2Id: { in: userIds } }
      ]
    }
  });

  await prisma.matchRequest.deleteMany({
    where: {
      OR: [
        { senderId: { in: userIds } },
        { receiverId: { in: userIds } }
      ]
    }
  });
}

async function calculateScore(currentUser, potentialMatch, currentUserPreferences, hasPendingRequest = false) {
  const weights = {
    courseOverlap: 0.30,
    proficiencyBalance: 0.20,
    averageRating: 0.20,
    pendingRequest: 0.10,
    schedulingPreference: 0.20
  };

  let courseOverlapScore = 0;
  let proficiencyBalanceScore = 0;
  let averageRatingScore = 0.4;
  let pendingRequestScore = hasPendingRequest ? 1 : 0;
  let schedulingPreferenceScore = 0;

  const currentUserCourseIds = new Set(currentUser.userCourses.map(uc => uc.courseId));
  const potentialMatchCourseIds = new Set(potentialMatch.userCourses.map(uc => uc.courseId));
  const sharedCourses = [...currentUserCourseIds].filter(id => potentialMatchCourseIds.has(id));
  const totalUniqueCourses = new Set([...currentUserCourseIds, ...potentialMatchCourseIds]).size;

  if (totalUniqueCourses > 0) {
    courseOverlapScore = sharedCourses.length / totalUniqueCourses;
  }

  if (sharedCourses.length > 0) {
    let proficiencyDifferenceSum = 0;

    sharedCourses.forEach(courseId => {
      const currentUserProficiency = currentUser.userCourses.find(uc => uc.courseId === courseId)?.proficiency || 1;
      const potentialMatchProficiency = potentialMatch.userCourses.find(uc => uc.courseId === courseId)?.proficiency || 1;
      proficiencyDifferenceSum += Math.abs(currentUserProficiency - potentialMatchProficiency);
    });

    const averageProficiencyDifference = proficiencyDifferenceSum / sharedCourses.length;
    proficiencyBalanceScore = 1 - (averageProficiencyDifference / 4);
  }

  if (currentUserPreferences && potentialMatch.studyPreferences) {
    try {
      const currentUserDays = JSON.parse(currentUserPreferences.preferredDays || '[]');
      const potentialMatchDays = JSON.parse(potentialMatch.studyPreferences.preferredDays || '[]');
      const currentUserTimeRanges = JSON.parse(currentUserPreferences.preferredTimeRanges || '[]');
      const potentialMatchTimeRanges = JSON.parse(potentialMatch.studyPreferences.preferredTimeRanges || '[]');

      const commonDays = currentUserDays.filter(day => potentialMatchDays.includes(day));
      let dayOverlapScore = 0;
      if (currentUserDays.length > 0) {
        dayOverlapScore = commonDays.length / currentUserDays.length;
      }

      let timeOverlapScore = 0;
      if (commonDays.length > 0 && currentUserTimeRanges.length > 0 && potentialMatchTimeRanges.length > 0) {
        let totalOverlapMinutes = 0;
        let totalUserMinutes = 0;

        for (const range of currentUserTimeRanges) {
          const startMinutes = convertTimeToMinutes(range.start);
          const endMinutes = convertTimeToMinutes(range.end);
          if (endMinutes > startMinutes) {
            totalUserMinutes += (endMinutes - startMinutes) * commonDays.length;
          }
        }

        for (const userRange of currentUserTimeRanges) {
          const userStart = convertTimeToMinutes(userRange.start);
          const userEnd = convertTimeToMinutes(userRange.end);

          for (const matchRange of potentialMatchTimeRanges) {
            const matchStart = convertTimeToMinutes(matchRange.start);
            const matchEnd = convertTimeToMinutes(matchRange.end);

            if (userStart < matchEnd && matchStart < userEnd) {
              const overlapStart = Math.max(userStart, matchStart);
              const overlapEnd = Math.min(userEnd, matchEnd);
              const overlapMinutes = overlapEnd - overlapStart;

              if (overlapMinutes > 0) {
                totalOverlapMinutes += overlapMinutes * commonDays.length;
              }
            }
          }
        }

        if (totalUserMinutes > 0) {
          timeOverlapScore = totalOverlapMinutes / totalUserMinutes;
        }
      }

      schedulingPreferenceScore = (dayOverlapScore * 0.7) + (timeOverlapScore * 0.3);

      if (currentUserPreferences.sessionDuration === potentialMatch.studyPreferences.sessionDuration) {
        schedulingPreferenceScore += 0.1;
      }

      schedulingPreferenceScore = Math.min(schedulingPreferenceScore, 1.0);
    } catch (error) {
      schedulingPreferenceScore = 0;
    }
  }

  const totalScore =
    (courseOverlapScore * weights.courseOverlap) +
    (proficiencyBalanceScore * weights.proficiencyBalance) +
    (averageRatingScore * weights.averageRating) +
    (pendingRequestScore * weights.pendingRequest) +
    (schedulingPreferenceScore * weights.schedulingPreference);

  return {
    total: Math.round(totalScore * 100) / 100,
    courseOverlap: Math.round(courseOverlapScore * 100) / 100,
    proficiencyBalance: Math.round(proficiencyBalanceScore * 100) / 100,
    averageRating: Math.round(averageRatingScore * 100) / 100,
    schedulingPreference: Math.round(schedulingPreferenceScore * 100) / 100
  };
}

async function testAlgorithm(users) {
  const userNameMap = {};
  for (const [key, id] of Object.entries(users)) {
    const user = await prisma.user.findUnique({ where: { id } });
    userNameMap[id] = user.name;
  }

  const testCases = [
    {
      name: "User 1 (Morning Weekday)",
      userId: users.user1
    },
    {
      name: "User 5 (Limited Availability)",
      userId: users.user5
    },
    {
      name: "User 4 (Weekend Only)",
      userId: users.user4
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n=== Testing ${testCase.name} ===`);

    const currentUser = await prisma.user.findUnique({
      where: { id: testCase.userId },
      include: { userCourses: true }
    });

    const currentUserPreferences = await prisma.studyPreferences.findUnique({
      where: { userId: testCase.userId }
    });

    if (currentUserPreferences) {
      const days = JSON.parse(currentUserPreferences.preferredDays || '[]');
      const timeRanges = JSON.parse(currentUserPreferences.preferredTimeRanges || '[]');
      console.log(`User preferences: ${days.join(', ')}`);
      console.log(`Time ranges: ${timeRanges.map(r => `${r.start}-${r.end}`).join(', ')}`);
    }

    const pendingRequests = await prisma.matchRequest.findMany({
      where: {
        receiverId: testCase.userId,
        status: 'PENDING'
      }
    });
    const pendingRequestSenderIds = pendingRequests.map(req => req.senderId);

    if (pendingRequestSenderIds.length > 0) {
      console.log(`User has pending requests from: ${pendingRequestSenderIds.join(', ')}`);
    }

    const otherUserIds = Object.values(users).filter(id => id !== testCase.userId);
    const potentialMatches = await prisma.user.findMany({
      where: { id: { in: otherUserIds } },
      include: {
        userCourses: true,
        studyPreferences: true
      }
    });

    const results = [];
    for (const match of potentialMatches) {
      const hasPendingRequest = pendingRequestSenderIds.includes(match.id);
      const score = await calculateScore(currentUser, match, currentUserPreferences, hasPendingRequest);

      results.push({
        name: match.name,
        id: match.id,
        hasPendingRequest,
        score: score
      });
    }

    results.sort((a, b) => b.score.total - a.score.total);

    console.log("\nResults:");
    results.forEach((result, i) => {
      const pendingTag = result.hasPendingRequest ? " [PENDING REQUEST]" : "";
      console.log(`${i+1}. ${result.name} (Score: ${result.score.total})${pendingTag}`);
    });
  }
}

async function main() {
  console.log("Testing recommendation algorithm with scheduling preferences");

  const users = await setupTestData();
  if (!users) return;

  await testAlgorithm(users);

  await prisma.$disconnect();
  console.log("\nTest completed!");
}

main();
