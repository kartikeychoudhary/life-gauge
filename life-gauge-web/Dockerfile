# Stage 1: Build Angular app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration=production

# Stage 2: Serve with nginx
FROM nginx:alpine
# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf
# Copy nginx template (uses envsubst for API_PORT)
COPY nginx.conf /etc/nginx/templates/default.conf.template
# Copy built Angular app
COPY --from=build /app/dist/life-gauge-web/browser /usr/share/nginx/html
EXPOSE 80
# nginx docker image auto-runs envsubst on .template files in /etc/nginx/templates/
CMD ["nginx", "-g", "daemon off;"]
