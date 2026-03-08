FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p uploads
EXPOSE ${API_PORT:-3000}
CMD ["sh", "-c", "npx knex migrate:latest --env production && node src/index.js"]
