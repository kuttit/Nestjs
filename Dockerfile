FROM node:20 AS build

# Upgrade npm
RUN npm i -g npm

WORKDIR /usr/src/app

COPY package*.json pnpm-lock.yaml ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3002

CMD ["npm", "start"]
