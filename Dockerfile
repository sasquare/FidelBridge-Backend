# Use official Node 18 slim image
FROM node:18.20.8-slim

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json if present for efficient npm install
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the application source code
COPY . .

# Create uploads directory with proper permissions to avoid runtime errors
RUN mkdir -p uploads && \
    chmod -R 777 uploads

# Expose the port the app runs on
EXPOSE 5000

# Run the app
CMD ["npm", "start"]
