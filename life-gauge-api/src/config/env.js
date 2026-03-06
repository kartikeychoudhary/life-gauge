const path = require('path');
const dotenv = require('dotenv');

// In Docker the env vars are injected directly; locally we load from root .env
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });
