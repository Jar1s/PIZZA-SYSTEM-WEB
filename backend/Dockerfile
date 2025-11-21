# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy shared module first
COPY shared ./shared

# Copy backend package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy backend source
COPY backend ./

# Generate Prisma client
RUN npx prisma generate

# Build shared module and application
RUN node build-shared.js && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port
EXPOSE 8080

# Start application
CMD ["npm", "run", "start:prod"]





















