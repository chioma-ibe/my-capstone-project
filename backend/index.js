const express = require('express');
const cors = require('cors');
const app = express();

const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const userCourseRoutes = require('./routes/userCourses');
const calendarRoutes = require('./routes/calendar');
const studyPreferencesRoutes = require('./routes/studyPreferences');
const userCache = require('./services/userCache');

const PORT = 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

app.get('/', (_, res) => { res.json({ message: 'study buddy' }); });

app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/user-courses', userCourseRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/study-preferences', studyPreferencesRoutes);

app.use((err, _req, res, _next) => {
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT);
