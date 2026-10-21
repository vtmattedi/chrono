# API + Socket.IO only; the frontend is served by apps/web (nginx).
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
EXPOSE 4500
CMD ["npm", "run", "start:prod"]
