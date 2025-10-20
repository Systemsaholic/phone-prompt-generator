# Use standard Node.js image for better compatibility
FROM node:20

# Install pnpm and ffmpeg
RUN npm install -g pnpm && \
    apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

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

# Create data and audio directories with proper permissions
RUN mkdir -p /app/data /app/public/audio /app/public/audio/samples && \
    chmod -R 777 /app/data /app/public/audio

# Build arguments for environment variables needed during build
ARG OPENAI_API_KEY
ARG DATABASE_URL="file:./data/prompts.db"
ARG NEXT_PUBLIC_APP_URL="http://localhost:3040"

# Set environment variables for build
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Build the Next.js application
RUN pnpm build

# Initialize the database
RUN pnpm exec prisma db push

# Ensure permissions are correct for runtime
RUN chmod -R 777 /app/data /app/public/audio

# Expose port
EXPOSE 3000

# Start the application with custom server
CMD ["node", "server.js"]