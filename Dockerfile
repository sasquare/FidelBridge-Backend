FROM node:18.20.8-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir -p uploads
EXPOSE 5000
CMD ["npm", "start"]