const express = require('express');
const { PrismaClient } = require('../generated/prisma');

const router = express.Router();
const prisma = new PrismaClient();

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
    console.error('Firebase auth error:', error);
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
});

router.get('/potential-matches/:userId', async (req, res) => {
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
        ratings: true
      }
    });

    const calculateMatchingScore = (currentUser, potentialMatch) => {
      const weights = {
        courseOverlap: 0.4,
        proficiencyBalance: 0.3,
        averageRating: 0.3
      };

      let courseOverlapScore = 0;
      let proficiencyBalanceScore = 0;
      let averageRatingScore = 0;

      const currentUserCourseIds = new Set(currentUser.userCourses.map(uc => uc.courseId));
      const potentialMatchCourseIds = new Set(potentialMatch.userCourses.map(uc => uc.courseId));

      const sharedCourses = [...currentUserCourseIds].filter(id => potentialMatchCourseIds.has(id));
      const totalUniqueCourses = new Set([...currentUserCourseIds, ...potentialMatchCourseIds]).size;

      if (totalUniqueCourses > 0) {
        courseOverlapScore = sharedCourses.length / totalUniqueCourses;
      }

      let proficiencyDifferenceSum = 0;
      let sharedCoursesCount = 0;

      sharedCourses.forEach(courseId => {
        const currentUserProficiency = currentUser.userCourses.find(uc => uc.courseId === courseId)?.proficiency || 1;
        const potentialMatchProficiency = potentialMatch.userCourses.find(uc => uc.courseId === courseId)?.proficiency || 1;

        proficiencyDifferenceSum += Math.abs(currentUserProficiency - potentialMatchProficiency);
        sharedCoursesCount++;
      });

      if (sharedCoursesCount > 0) {
        const averageProficiencyDifference = proficiencyDifferenceSum / sharedCoursesCount;
        const maxProficiencyDifference = 4;
        proficiencyBalanceScore = 1 - (averageProficiencyDifference / maxProficiencyDifference);
      }
      // Calculate actual rating score - we need to fetch ratings for this user
      // For now using default, but this should be replaced with actual rating calculation
      if (potentialMatch.ratings && potentialMatch.ratings.length > 0) {
        const avgRating = potentialMatch.ratings.reduce((sum, rating) => sum + rating.score, 0) / potentialMatch.ratings.length;
        averageRatingScore = avgRating / 5; // Normalize to 0-1 scale (assuming 1-5 rating scale)
      } else {
        averageRatingScore = 0.4; // Default for users with no ratings
      }

      const totalScore =
        (courseOverlapScore * weights.courseOverlap) +
        (proficiencyBalanceScore * weights.proficiencyBalance) +
        (averageRatingScore * weights.averageRating);

      return Math.round(totalScore * 100) / 100;
    };

    const matchesWithSharedCourses = potentialMatches
      .map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        profilePhoto: user.profilePhoto,
        matchedAt: new Date().toISOString().split('T')[0],
        matchingScore: calculateMatchingScore(currentUser, user),
        sharedCourses: user.userCourses.map(uc => ({
          id: uc.course.id,
          name: uc.course.name,
          proficiency: uc.proficiency
        }))
      }))
      .sort((a, b) => b.matchingScore - a.matchingScore)
      .slice(0, 10);

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
    console.error('Error creating match:', error);
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
    console.error('Error fetching confirmed matches:', error);
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
    console.error('Error creating rating:', error);
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

module.exports = router;
