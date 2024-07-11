FROM node:20 AS build

RUN npm install -g pnpm
WORKDIR  /usr/src/app
COPY package*.json pnpm-lock.yaml*  ./
RUN pnpm install
RUN npm install @opentelemetry/resources

RUN npm install @opentelemetry/semantic-conventions

COPY . .

RUN pnpm run build

EXPOSE 3002

CMD ["pnpm", "start:dev"]
