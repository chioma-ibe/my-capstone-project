const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const userCache = require('../services/userCache');

const router = express.Router();
const prisma = new PrismaClient();

function convertTimeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return (hours * 60) + minutes;
}

router.post('/firebase-auth', async (req, res) => {
  try {
    const { firebaseId, email, name } = req.body;

    if (!firebaseId || !email) {
      return res.status(400).json({
        error: 'Firebase ID and email are required'
      });
    }

    let user = await prisma.user.findUnique({
      where: { firebaseId },
      include: {
        userCourses: {
          include: {
            course: true
          }
        }
      }
    });

    if (!user) {
      const userData = {
        firebaseId,
        email,
        name: name || email.split('@')[0],
        password: '',
      };

      const includeOptions = {
        userCourses: {
          include: {
            course: true
          }
        }
      };

      user = await prisma.user.create({
        data: userData,
        include: includeOptions
      });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
});

router.get('/potential-matches/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const cachedMatches = userCache.getPotentialMatches(userId);
    if (cachedMatches) {
      return res.json(cachedMatches);
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userCourses: {
          include: {
            course: true
          }
        }
      }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUserCourseIds = currentUser.userCourses.map(uc => uc.courseId);

    if (currentUserCourseIds.length === 0) {
      return res.json([]);
    }

    const existingMatches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });

    const matchedUserIds = existingMatches.map(match =>
      match.user1Id === userId ? match.user2Id : match.user1Id
    );

    const excludedUserIds = [...matchedUserIds, userId];
    const pendingRequests = await prisma.matchRequest.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING'
      }
    });
    const pendingRequestSenderIds = pendingRequests.map(req => req.senderId);

    const potentialMatches = await prisma.user.findMany({
      where: {
        id: { notIn: excludedUserIds },
        userCourses: {
          some: {
            courseId: { in: currentUserCourseIds }
          }
        }
      },
      include: {
        userCourses: {
          include: {
            course: true
          },
          where: {
            courseId: { in: currentUserCourseIds }
          }
        },
        ratings: true,
        studyPreferences: true
      }
    });
    const currentUserPreferences = await prisma.studyPreferences.findUnique({
      where: { userId: userId }
    });

    const getNormalizedWeights = (userPreferences) => {
      const userWeights = {
        courseOverlap: userPreferences?.weightCourseOverlap || 0.40,
        proficiencyBalance: userPreferences?.weightProficiencyBalance || 0.30,
        userRating: userPreferences?.weightUserRating || 0.30
      };

      const totalUserWeight = userWeights.courseOverlap + userWeights.proficiencyBalance + userWeights.userRating;
      const normalizationFactor = 0.7 / totalUserWeight;

      return {
        courseOverlap: userWeights.courseOverlap * normalizationFactor,
        proficiencyBalance: userWeights.proficiencyBalance * normalizationFactor,
        averageRating: userWeights.userRating * normalizationFactor,
        pendingRequest: 0.10,
        schedulingPreference: 0.20
      };
    };

    const calculateCourseOverlapScore = (currentUser, potentialMatch) => {
      const currentUserCourseIds = new Set(currentUser.userCourses.map(uc => uc.courseId));
      const potentialMatchCourseIds = new Set(potentialMatch.userCourses.map(uc => uc.courseId));

      const sharedCourses = [...currentUserCourseIds].filter(id => potentialMatchCourseIds.has(id));
      const totalUniqueCourses = new Set([...currentUserCourseIds, ...potentialMatchCourseIds]).size;

      return totalUniqueCourses > 0 ? sharedCourses.length / totalUniqueCourses : 0;
    };

    const calculateProficiencyBalanceScore = (currentUser, potentialMatch) => {
      const currentUserCourseIds = new Set(currentUser.userCourses.map(uc => uc.courseId));
      const potentialMatchCourseIds = new Set(potentialMatch.userCourses.map(uc => uc.courseId));
      const sharedCourses = [...currentUserCourseIds].filter(id => potentialMatchCourseIds.has(id));

      if (sharedCourses.length === 0) return 0;

      let proficiencyDifferenceSum = 0;

      sharedCourses.forEach(courseId => {
        const currentUserProficiency = currentUser.userCourses.find(uc => uc.courseId === courseId)?.proficiency || 1;
        const potentialMatchProficiency = potentialMatch.userCourses.find(uc => uc.courseId === courseId)?.proficiency || 1;
        proficiencyDifferenceSum += Math.abs(currentUserProficiency - potentialMatchProficiency);
      });

      const averageProficiencyDifference = proficiencyDifferenceSum / sharedCourses.length;
      const maxProficiencyDifference = 4;
      return 1 - (averageProficiencyDifference / maxProficiencyDifference);
    };

    const calculateAverageRatingScore = (potentialMatch) => {
      if (potentialMatch.ratings && potentialMatch.ratings.length > 0) {
        const avgRating = potentialMatch.ratings.reduce((sum, rating) => sum + rating.score, 0) / potentialMatch.ratings.length;
        return avgRating / 5;
      }
      return 0.4;
    };

    const calculateSchedulingPreferenceScore = (currentUserPreferences, potentialMatchPreferences) => {
      if (!currentUserPreferences || !potentialMatchPreferences) return 0;

      try {
        const currentUserDays = JSON.parse(currentUserPreferences.preferredDays || '[]');
        const potentialMatchDays = JSON.parse(potentialMatchPreferences.preferredDays || '[]');
        const currentUserTimeRanges = JSON.parse(currentUserPreferences.preferredTimeRanges || '[]');
        const potentialMatchTimeRanges = JSON.parse(potentialMatchPreferences.preferredTimeRanges || '[]');
        const commonDays = currentUserDays.filter(day => potentialMatchDays.includes(day));

        let dayOverlapScore = 0;
        if (currentUserDays.length > 0) {
          dayOverlapScore = commonDays.length / currentUserDays.length;
        }

        let timeOverlapScore = 0;
        if (commonDays.length > 0 && currentUserTimeRanges.length > 0 && potentialMatchTimeRanges.length > 0) {
          timeOverlapScore = calculateTimeOverlapScore(currentUserTimeRanges, potentialMatchTimeRanges, commonDays);
        }

        let schedulingScore = (dayOverlapScore * 0.7) + (timeOverlapScore * 0.3);

        if (currentUserPreferences.sessionDuration === potentialMatchPreferences.sessionDuration) {
          schedulingScore += 0.1;
        }

        return Math.min(schedulingScore, 1.0);
      } catch (error) {
        return 0;
      }
    };

    const calculateTimeOverlapScore = (userTimeRanges, matchTimeRanges, commonDays) => {
      let totalOverlapMinutes = 0;
      let totalUserMinutes = 0;

      for (const range of userTimeRanges) {
        const startMinutes = convertTimeToMinutes(range.start);
        const endMinutes = convertTimeToMinutes(range.end);
        if (endMinutes > startMinutes) {
          totalUserMinutes += (endMinutes - startMinutes) * commonDays.length;
        }
      }

      if (totalUserMinutes === 0) return 0;

      for (const userRange of userTimeRanges) {
        const userStart = convertTimeToMinutes(userRange.start);
        const userEnd = convertTimeToMinutes(userRange.end);

        for (const matchRange of matchTimeRanges) {
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

      return totalOverlapMinutes / totalUserMinutes;
    };

    const calculateMatchingScore = (currentUser, potentialMatch, hasPendingRequest = false) => {
      const weights = getNormalizedWeights(currentUserPreferences);

      const courseOverlapScore = calculateCourseOverlapScore(currentUser, potentialMatch);
      const proficiencyBalanceScore = calculateProficiencyBalanceScore(currentUser, potentialMatch);
      const averageRatingScore = calculateAverageRatingScore(potentialMatch);
      const pendingRequestScore = hasPendingRequest ? 1 : 0;
      const schedulingPreferenceScore = calculateSchedulingPreferenceScore(
        currentUserPreferences,
        potentialMatch.studyPreferences
      );

      const totalScore =
        (courseOverlapScore * weights.courseOverlap) +
        (proficiencyBalanceScore * weights.proficiencyBalance) +
        (averageRatingScore * weights.averageRating) +
        (pendingRequestScore * weights.pendingRequest) +
        (schedulingPreferenceScore * weights.schedulingPreference);

      return Math.round(totalScore * 100) / 100;
    };

    const matchesWithSharedCourses = potentialMatches
      .map(user => {
        const averageRating = user.ratings.length > 0
          ? user.ratings.reduce((sum, rating) => sum + rating.score, 0) / user.ratings.length
          : 0;

        const hasPendingRequest = pendingRequestSenderIds.includes(user.id);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          profilePhoto: user.profilePhoto,
          matchedAt: new Date().toISOString().split('T')[0],
          matchingScore: calculateMatchingScore(currentUser, user, hasPendingRequest),
          averageRating: Math.round(averageRating * 10) / 10,
          totalRatings: user.ratings.length,
          hasPendingRequest: hasPendingRequest,
          sharedCourses: user.userCourses.map(uc => ({
            id: uc.course.id,
            name: uc.course.name,
            proficiency: uc.proficiency
          }))
        };
      })
      .sort((a, b) => b.matchingScore - a.matchingScore)
      .slice(0, 10);

    userCache.setPotentialMatches(userId, matchesWithSharedCourses, 300);

    res.json(matchesWithSharedCourses);
  } catch (error) {
    console.error('Error fetching potential matches:', error);
    res.status(500).json({ error: 'Failed to fetch potential matches' });
  }
});

router.post('/matches', async (req, res) => {
  try {
    const { user1Id, user2Id } = req.body;

    if (!user1Id || !user2Id) {
      return res.status(400).json({ error: 'Both user IDs are required' });
    }

    if (user1Id === user2Id) {
      return res.status(400).json({ error: 'Cannot match with yourself' });
    }

    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: parseInt(user1Id), user2Id: parseInt(user2Id) },
          { user1Id: parseInt(user2Id), user2Id: parseInt(user1Id) }
        ]
      }
    });

    if (existingMatch) {
      return res.status(409).json({ error: 'Match already exists' });
    }

    const match = await prisma.match.create({
      data: {
        user1Id: parseInt(user1Id),
        user2Id: parseInt(user2Id)
      },
      include: {
        user1: true,
        user2: true
      }
    });

    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create match' });
  }
});

router.get('/confirmed-matches/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userCourses: {
          include: {
            course: true
          }
        }
      }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: {
          include: {
            userCourses: {
              include: {
                course: true
              }
            }
          }
        },
        user2: {
          include: {
            userCourses: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    const confirmedMatches = matches.map(match => {
      const matchedUser = match.user1Id === userId ? match.user2 : match.user1;
      const currentUserCourseIds = currentUser.userCourses.map(uc => uc.courseId);

      const sharedCourses = matchedUser.userCourses
        .filter(uc => currentUserCourseIds.includes(uc.courseId))
        .map(uc => ({
          id: uc.course.id,
          name: uc.course.name,
          proficiency: uc.proficiency
        }));

      return {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        bio: matchedUser.bio,
        profilePhoto: matchedUser.profilePhoto,
        matchedAt: match.matchedAt.toISOString().split('T')[0],
        sharedCourses: sharedCourses
      };
    });

    res.json(confirmedMatches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch confirmed matches' });
  }
});

router.post('/ratings', async (req, res) => {
  try {
    const { userId, partnerId, score } = req.body;

    const rating = await prisma.rating.upsert({
      where: {
        userId_partnerId: {
          userId: parseInt(userId),
          partnerId: parseInt(partnerId)
        }
      },
      update: {
        score: parseInt(score)
      },
      create: {
        userId: parseInt(userId),
        partnerId: parseInt(partnerId),
        score: parseInt(score)
      }
    });

    res.json(rating);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create rating' });
  }
});

router.get('/ratings/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const ratings = await prisma.rating.findMany({
      where: { partnerId: userId },
      orderBy: { createdAt: 'desc' }
    });

    const averageScore = ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length
      : 0;

    res.json({
      ratings,
      averageScore: Math.round(averageScore * 10) / 10,
      totalRatings: ratings.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

router.get('/ratings/:userId/:partnerId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const partnerId = parseInt(req.params.partnerId);

    const rating = await prisma.rating.findUnique({
      where: {
        userId_partnerId: {
          userId,
          partnerId
        }
      }
    });

    res.json(rating);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
});

router.put('/update/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { bio, name, profilePhoto } = req.body;

    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (name !== undefined) updateData.name = name;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user information' });
  }
});

router.post('/match-requests', async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Both sender and receiver IDs are required' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send match request to yourself' });
    }

    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: parseInt(senderId), user2Id: parseInt(receiverId) },
          { user1Id: parseInt(receiverId), user2Id: parseInt(senderId) }
        ]
      }
    });

    if (existingMatch) {
      return res.status(409).json({ error: 'Match already exists' });
    }

    await prisma.matchRequest.findFirst({
      where: {
        senderId: parseInt(receiverId),
        receiverId: parseInt(senderId),
        status: 'PENDING'
      }
    });

    const existingRequest = await prisma.matchRequest.findFirst({
      where: {
        senderId: parseInt(senderId),
        receiverId: parseInt(receiverId)
      }
    });

    if (existingRequest) {
      return res.status(409).json({ error: 'Match request already exists' });
    }

    const matchRequest = await prisma.matchRequest.create({
      data: {
        senderId: parseInt(senderId),
        receiverId: parseInt(receiverId),
        status: 'PENDING'
      },
      include: {
        sender: true,
        receiver: true
      }
    });

    res.status(201).json(matchRequest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create match request' });
  }
});

router.get('/match-requests/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const receivedRequests = await prisma.matchRequest.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING'
      },
      include: {
        sender: {
          include: {
            userCourses: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    res.json(receivedRequests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match requests' });
  }
});

router.put('/match-requests/:requestId', async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId);
    const { status } = req.body;

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be ACCEPTED or REJECTED' });
    }

    const matchRequest = await prisma.matchRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        sender: true,
        receiver: true
      }
    });

    if (status === 'ACCEPTED') {
      await prisma.match.create({
        data: {
          user1Id: matchRequest.senderId,
          user2Id: matchRequest.receiverId
        }
      });
    }

    res.json(matchRequest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update match request' });
  }
});

module.exports = router;
