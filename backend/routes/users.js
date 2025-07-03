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

    const potentialMatches = await prisma.user.findMany({
      where: {
        id: { not: userId },
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
        }
      }
    });

    const matchesWithSharedCourses = potentialMatches.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      sharedCourses: user.userCourses.map(uc => ({
        id: uc.course.id,
        name: uc.course.name,
        proficiency: uc.proficiency
      }))
    }));

    res.json(matchesWithSharedCourses);
  } catch (error) {
    console.error('Error fetching potential matches:', error);
    res.status(500).json({ error: 'Failed to fetch potential matches' });
  }
});

module.exports = router;
