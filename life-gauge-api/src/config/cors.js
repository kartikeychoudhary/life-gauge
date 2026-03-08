const ngPort = process.env.NG_PORT || '4200';
const corsOptions = {
  origin: `http://localhost:${ngPort}`,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = corsOptions;
