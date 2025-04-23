# Use the official Node.js image from DockerHub
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Your app listens on port 5000
EXPOSE 5000

# Command to run your app
CMD ["npm", "start"]
