# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy shared module first (from root context)
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

# Build shared module first
RUN node build-shared.js

# Update tsconfig.json paths for Docker context (shared is in ./shared, not ../shared)
RUN sed -i 's|"../shared"|"./shared"|g' tsconfig.json || true

# Build application (this will fail if there are TypeScript errors)
RUN npm run build || (echo "❌ Build failed! Checking dist/ contents:" && ls -la dist/ 2>/dev/null || echo "dist/ does not exist" && exit 1)

# Verify that main.js was created
RUN if [ ! -f dist/main.js ]; then \
      echo "❌ ERROR: dist/main.js not found after build!"; \
      echo "📁 Contents of dist/:"; \
      ls -la dist/ || echo "dist/ does not exist"; \
      echo "📁 Contents of dist/src/ (if exists):"; \
      ls -la dist/src/ 2>/dev/null || echo "dist/src/ does not exist"; \
      exit 1; \
    fi && \
    echo "✅ Verified: dist/main.js exists"

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files (from root context)
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





















