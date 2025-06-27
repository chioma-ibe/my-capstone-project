const express = require('express');
const cors = require('cors');
const app = express();

const userRoutes = require('./routes/users');

const PORT = 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

app.get('/', (_, res) => { res.json({ message: 'study buddy' }); });

app.use('/api/users', userRoutes);

app.use((err, _req, res, _next) => {
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {});
