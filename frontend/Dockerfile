FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with a clean lockfile state
RUN npm ci

# Provide API endpoints at build time (can be overridden via build args)
ARG NEXT_PUBLIC_API_URL=https://santeapp.serveirc.com
ARG NEXT_INTERNAL_API_URL=http://backend:8000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_INTERNAL_API_URL=${NEXT_INTERNAL_API_URL}

# Copy application source
COPY . .

# Build the Next.js application ahead of time
RUN npm run build

# Prune development dependencies to slim the image
RUN npm prune --omit=dev

# Ensure production environment inside the container
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node healthcheck.js || exit 1

# Run the production server
CMD ["npm", "run", "start"]
