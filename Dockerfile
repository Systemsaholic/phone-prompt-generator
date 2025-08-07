# Use Node.js Alpine image for smaller size
FROM node:20-alpine

# Install pnpm and ffmpeg
RUN npm install -g pnpm && \
    apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm exec prisma generate

# Copy the rest of the application
COPY . .

# Create data and audio directories
RUN mkdir -p /app/data /app/public/audio

# Build the Next.js application
RUN pnpm build

# Initialize the database
RUN pnpm exec prisma db push

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]