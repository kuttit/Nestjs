# Stage 1: Build the application
FROM node:20 AS build

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Install additional dependencies
RUN pnpm add @opentelemetry/resources @opentelemetry/semantic-conventions

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm run build

# Stage 2: Create the final image
FROM node:20-alpine AS production

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory
WORKDIR /usr/src/app

# Copy the build output and necessary files from the build stage
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /usr/src/app/node_modules ./node_modules

# Expose the application port
EXPOSE 3002

# Command to run the application
CMD ["pnpm", "start:prod"]
