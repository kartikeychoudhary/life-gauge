require('./config/env');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const corsOptions = require('./config/cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./auth/auth.routes');
const userRoutes = require('./user/user.routes');
const healthTestRoutes = require('./healthtest/healthtest.routes');
const dashboardRoutes = require('./dashboard/dashboard.routes');

const app = express();

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/health-reports', healthTestRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

module.exports = app;
