FROM node:20-alpine AS build
RUN npm i -g pnpm
WORKDIR /usr/src/app
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm build
EXPOSE 3002
CMD ["pnpm","start:dev"]
