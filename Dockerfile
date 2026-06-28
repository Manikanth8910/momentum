# Multi-stage build for Momentum Backend and Frontend serving (or API only)
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
# Optional: compile typescript if backend was typescript

FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Final Production Image (for backend)
FROM node:20-alpine
WORKDIR /app
COPY --from=backend-build /app ./
EXPOSE 5050
CMD ["npm", "start"]
