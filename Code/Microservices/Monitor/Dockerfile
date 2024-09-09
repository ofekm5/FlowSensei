# Dockerfile
FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 7000

CMD ["node", "dist/server.js"]
