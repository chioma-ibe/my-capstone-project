const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

const courses = [
  {
    name: 'Introduction to Computer Science',
    description: 'Fundamental concepts of computer science including programming basics, algorithms, and data structures.'
  },
  {
    name: 'Data Structures and Algorithms',
    description: 'Advanced study of data structures, algorithm design, and complexity analysis.'
  },
  {
    name: 'Web Development',
    description: 'Full-stack web development including HTML, CSS, JavaScript, and modern frameworks.'
  },
  {
    name: 'Database Systems',
    description: 'Design and implementation of database systems, SQL, and database management.'
  },
  {
    name: 'Machine Learning',
    description: 'Introduction to machine learning algorithms, statistical learning, and AI applications.'
  },
  {
    name: 'Software Engineering',
    description: 'Software development lifecycle, project management, and engineering best practices.'
  },
  {
    name: 'Operating Systems',
    description: 'Study of operating system concepts, processes, memory management, and file systems.'
  },
  {
    name: 'Computer Networks',
    description: 'Network protocols, architecture, and distributed systems fundamentals.'
  },
  {
    name: 'Mobile App Development',
    description: 'Development of mobile applications for iOS and Android platforms.'
  },
  {
    name: 'Artificial Intelligence',
    description: 'AI concepts, search algorithms, knowledge representation, and expert systems.'
  },
  {
    name: 'Calculus I',
    description: 'Differential calculus, limits, derivatives, and applications.'
  },
  {
    name: 'Calculus II',
    description: 'Integral calculus, sequences, series, and multivariable calculus introduction.'
  },
  {
    name: 'Linear Algebra',
    description: 'Vector spaces, matrices, eigenvalues, and linear transformations.'
  },
  {
    name: 'Statistics',
    description: 'Probability theory, statistical inference, and data analysis methods.'
  },
  {
    name: 'Physics I',
    description: 'Classical mechanics, motion, forces, energy, and momentum.'
  }
];

async function seedCourses() {
  try {
    for (const course of courses) {
      await prisma.course.upsert({
        where: { name: course.name },
        update: {},
        create: course
      });
    }
  } catch (error) {
    console.error('Error seeding courses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCourses();
