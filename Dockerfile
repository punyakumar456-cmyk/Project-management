# Railway production image for the full-stack app.
FROM node:24-alpine AS frontend-builder

WORKDIR /app/frontend

COPY task-manager-frontend/package*.json ./
RUN npm ci

COPY task-manager-frontend/ ./
RUN npm run build

FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY task-manager-backend/package*.json ./
RUN npm ci --omit=dev

COPY task-manager-backend/ ./
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 5000

CMD ["npm", "start"]
