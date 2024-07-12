# Stage 1: Build Stage
FROM node:20 AS build

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /usr/src/app

# Copy package.json, pnpm-lock.yaml (if exists) for installation
COPY package*.json pnpm-lock.yaml* ./

# Install dependencies using pnpm
RUN pnpm install

# Install specific npm packages needed for the application
RUN npm install @opentelemetry/resources
RUN npm install @opentelemetry/semantic-conventions

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm run build

# Expose port 3002
EXPOSE 3002

# Command to run the application
CMD ["pnpm", "start:dev"]

