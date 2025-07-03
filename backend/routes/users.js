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

module.exports = router;
