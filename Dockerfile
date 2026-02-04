# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package.json yarn.lock* ./

# Install production dependencies + TypeScript (needed for next.config.ts)
RUN yarn install --production --frozen-lockfile && yarn add typescript

# Copy built application from builder stage
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/next.config.* ./

# Expose port (container internal port)
EXPOSE 5000

# Set environment variables
ENV PORT=5000
ENV NODE_ENV=production

# Start the application
CMD ["yarn", "start"]
