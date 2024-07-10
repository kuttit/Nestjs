FROM node:20 AS build

# Upgrade npm
RUN npm i -g npm

WORKDIR /usr/src/app
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm build
EXPOSE 3002
CMD ["pnpm","start:dev"]
