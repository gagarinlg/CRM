# ────────────────────────────────────────────────────────────────────────────
# Stage 1 – Build the React frontend
# ────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /build/client

# Copy only the client package files first to leverage layer caching
COPY src/client/package*.json ./
RUN npm install --legacy-peer-deps

# Copy client source and build
COPY src/client/ ./
RUN npm run build


# ────────────────────────────────────────────────────────────────────────────
# Stage 2 – Production image
# ────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling and curl for the health check
RUN apk add --no-cache dumb-init curl

# Run as a non-root user for security
RUN addgroup -S crm && adduser -S crm -G crm

WORKDIR /app

# Copy backend package files and install production dependencies only
COPY package.json ./
COPY src/server/package*.json ./src/server/
RUN npm install --workspace=src/server --production --ignore-scripts

# Copy server source code
COPY src/server/ ./src/server/

# Copy the built frontend into a location the server can serve
COPY --from=frontend-builder /build/client/dist ./src/client/dist

# Create logs directory with correct ownership
RUN mkdir -p /app/logs && chown -R crm:crm /app

USER crm

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -sf http://localhost:${PORT}/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server/app.js"]
