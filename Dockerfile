# Use official Node.js slim LTS image
FROM node:18.20.8-slim

# Set working directory
WORKDIR /app

# Copy package files first (optimizes Docker layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project
COPY . .

# Fix: Ensure correct case for uploads directory
RUN mkdir -p Uploads

# Expose the port your server uses
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
