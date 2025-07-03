const express = require('express');
const { PrismaClient } = require('../generated/prisma');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});


module.exports = router;
