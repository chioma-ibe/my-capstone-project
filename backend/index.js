const express = require('express');
const cors = require('cors');
const app = express();
const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

const PORT = 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

 app.get('/', (_, res) => { res.json({ message: 'study buddy' }); });
