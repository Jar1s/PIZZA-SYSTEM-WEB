# Build stage
FROM node:20-alpine AS builder

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
# The build command runs: prebuild (rimraf dist), build (nest build), postbuild (build-shared, fix-shared-imports, fix-main)
RUN npm run build || (echo "❌ Build failed! Checking dist/ contents:" && ls -la dist/ 2>/dev/null || echo "dist/ does not exist" && exit 1)

# Move all files from dist/src/ to dist/ if they exist there (NestJS outputs to dist/src/ by default)
RUN if [ -d dist/src ] && [ -f dist/src/main.js ]; then \
      echo "📦 Moving all files from dist/src/ to dist/"; \
      cp -r dist/src/* dist/ && \
      rm -rf dist/src && \
      echo "✅ Files moved successfully"; \
    fi

# Verify that main.js was created
RUN if [ ! -f dist/main.js ]; then \
      echo "❌ ERROR: dist/main.js not found after build!"; \
      echo "📁 Contents of dist/:"; \
      ls -la dist/ || echo "dist/ does not exist"; \
      echo "📁 Contents of dist/src/ (if exists):"; \
      ls -la dist/src/ 2>/dev/null || echo "dist/src/ does not exist"; \
      exit 1; \
    fi && \
    echo "✅ Verified: dist/main.js exists" && \
    echo "📁 Verifying app.module.js exists:" && \
    ls -la dist/app.module.js 2>/dev/null && echo "✅ app.module.js found" || echo "⚠️  app.module.js not found (may be in subdirectory)"

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files (from root context)
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install production dependencies only (but skip postinstall to avoid generating Prisma with wrong targets)
RUN npm ci --only=production --ignore-scripts

# Clear any existing Prisma cache and regenerate with correct binaryTargets for production
# Schema now only includes linux-musl-openssl-3.0.x, so only that engine will be generated
RUN rm -rf node_modules/.prisma node_modules/@prisma/client && \
    echo "🔧 Generating Prisma client with OpenSSL 3.0.x engine only..." && \
    npx prisma generate --schema=./prisma/schema.prisma && \
    echo "🔍 Verifying Prisma engine..." && \
    if [ -f node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node ]; then \
      echo "✅ Correct engine (openssl-3.0.x) found!"; \
      if [ -f node_modules/.prisma/client/libquery_engine-linux-musl.so.node ]; then \
        echo "⚠️  Removing old engine (libquery_engine-linux-musl.so.node)..."; \
        rm -f node_modules/.prisma/client/libquery_engine-linux-musl.so.node; \
      fi; \
    else \
      echo "❌ ERROR: openssl-3.0.x engine not found!"; \
      echo "📁 Listing all files in .prisma/client:"; \
      ls -la node_modules/.prisma/client/ || echo "Directory does not exist"; \
      exit 1; \
    fi

# Copy built application (includes all compiled files)
COPY --from=builder /app/dist ./dist
# Don't copy Prisma client from builder - regenerate it in production with correct binaryTargets
# COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Copy scripts and shared module source for rebuilding
COPY --from=builder /app/fix-main.js ./fix-main.js
COPY --from=builder /app/build-shared.js ./build-shared.js
COPY --from=builder /app/setup-module-resolution.js ./setup-module-resolution.js
COPY --from=builder /app/shared ./shared
# Copy setup-module-resolution.js to dist/ so it can be required from main.js
RUN cp setup-module-resolution.js dist/setup-module-resolution.js

# Rebuild shared module (it gets deleted by prebuild rimraf)
RUN echo "🔧 Rebuilding shared module..." && \
    node build-shared.js && \
    echo "✅ Shared module rebuilt"

# Verify critical files exist and fix shared module resolution
RUN if [ ! -f dist/main.js ]; then \
      echo "❌ ERROR: dist/main.js not found in production image!"; \
      ls -la dist/ || echo "dist/ does not exist"; \
      exit 1; \
    fi && \
    if [ ! -f dist/app.module.js ]; then \
      echo "⚠️  WARNING: dist/app.module.js not found - checking structure:"; \
      find dist -name "app.module.js" || echo "app.module.js not found anywhere"; \
    fi && \
    if [ ! -f dist/shared/index.js ]; then \
      echo "❌ ERROR: dist/shared/index.js not found after rebuild!"; \
      ls -la dist/ || echo "dist/ does not exist"; \
      exit 1; \
    fi && \
    echo "✅ Verified: dist/shared/index.js exists" && \
    echo "🔧 Running fix-main.js to set up module resolution..." && \
    node fix-main.js || echo "⚠️  fix-main.js failed, but continuing..."

# Expose port
EXPOSE 8080

# Start application
CMD ["npm", "run", "start:prod"]





















