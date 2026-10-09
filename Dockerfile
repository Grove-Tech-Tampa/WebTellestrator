# Use official Node.js 20 Alpine lightweight image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Copy package configuration files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source code
COPY server/ ./server/
COPY public/ ./public/

# Ensure data and upload persistence directories exist
RUN mkdir -p /app/server/data /app/public/uploads

# Expose server port
EXPOSE 3000

# Health check to ensure server responsiveness
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start production server
CMD ["node", "server/index.js"]
