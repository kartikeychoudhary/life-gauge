require('./config/env');
const app = require('./app');

const PORT = process.env.API_PORT || 3000;

app.listen(PORT, () => {
  console.log(`Life Gauge API running on port ${PORT}`);
});
