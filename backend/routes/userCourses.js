const express = require('express');
const { PrismaClient } = require('../generated/prisma');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const userCourses = await prisma.userCourse.findMany({
      where: { userId },
      include: {
        course: true
      },
      orderBy: {
        course: {
          name: 'asc'
        }
      }
    });

    res.json(userCourses);
  } catch (error) {
    console.error('Error fetching user courses:', error);
    res.status(500).json({ error: 'Failed to fetch user courses' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, courseId, proficiency = 1 } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({
        error: 'User ID and Course ID are required'
      });
    }

    const existingUserCourse = await prisma.userCourse.findUnique({
      where: {
        userId_courseId: {
          userId: parseInt(userId),
          courseId: parseInt(courseId)
        }
      }
    });

    if (existingUserCourse) {
      return res.status(409).json({ error: 'User already enrolled in this course' });
    }

    const userCourse = await prisma.userCourse.create({
      data: {
        userId: parseInt(userId),
        courseId: parseInt(courseId),
        proficiency: parseInt(proficiency)
      },
      include: {
        course: true
      }
    });

    res.status(201).json(userCourse);
  } catch (error) {
    console.error('Error adding user course:', error);
    res.status(500).json({ error: 'Failed to add course to user' });
  }
});

router.delete('/:userId/:courseId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const courseId = parseInt(req.params.courseId);

    if (isNaN(userId) || isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid user ID or course ID' });
    }

    const deletedUserCourse = await prisma.userCourse.delete({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    res.json({ message: 'Course removed successfully', deletedUserCourse });
  } catch (error) {
    console.error('Error removing user course:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User course not found' });
    }
    res.status(500).json({ error: 'Failed to remove course from user' });
  }
});

router.put('/:userId/:courseId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const courseId = parseInt(req.params.courseId);
    const { proficiency } = req.body;

    if (isNaN(userId) || isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid user ID or course ID' });
    }

    if (!proficiency || proficiency < 1 || proficiency > 5) {
      return res.status(400).json({ error: 'Proficiency must be between 1 and 5' });
    }

    const updatedUserCourse = await prisma.userCourse.update({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      data: {
        proficiency: parseInt(proficiency)
      },
      include: {
        course: true
      }
    });

    res.json(updatedUserCourse);
  } catch (error) {
    console.error('Error updating user course:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User course not found' });
    }
    res.status(500).json({ error: 'Failed to update user course' });
  }
});

module.exports = router;
