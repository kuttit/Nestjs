# Use the official Node.js 20 image from Docker Hub for the entire build process
FROM node:20 AS builder

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml (if exists) for dependency installation
COPY package*.json pnpm-lock.yaml* ./

# Install dependencies using pnpm
RUN npm install

# Install additional dependencies
RUN npm install @opentelemetry/resources @opentelemetry/semantic-conventions

# Copy the rest of the application code
COPY . .

# Build your application
RUN npm run build

# Production stage to create a lightweight production image
FROM node:20-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy only the necessary files from the builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY package*.json pnpm-lock.yaml* ./

# Install production dependencies (excluding devDependencies)
RUN npm install --only=production

# Remove unnecessary files after installing production dependencies
RUN rm package*.json pnpm-lock.yaml*

# Expose port 3002 (adjust according to your application)
EXPOSE 3002

# Command to run the application in production
CMD ["node", "dist/main"]
