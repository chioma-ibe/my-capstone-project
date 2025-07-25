const express = require('express');
const { PrismaClient } = require('../generated/prisma');
const userCache = require('../services/userCache');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (_, res) => {
  try {
    const cachedCourses = userCache.getCourses();
    if (cachedCourses) {
      return res.json(cachedCourses);
    }

    const courses = await prisma.course.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    userCache.setCourses(courses, 3600);

    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});


module.exports = router;
