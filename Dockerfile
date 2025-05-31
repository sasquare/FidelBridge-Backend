# ✅ Use official Node.js LTS base image
FROM node:18-slim

# ✅ Set working directory
WORKDIR /app

# ✅ Copy package files first for better Docker cache performance
COPY package*.json ./

# ✅ Install dependencies
RUN npm install

# ✅ Copy the rest of the application files
COPY . .

# ✅ Create uploads directory with appropriate permissions
RUN mkdir -p uploads && chmod -R 755 uploads

# ✅ Ensure .env variables are loaded by your hosting platform (not from Dockerfile)
# If needed, platform should inject them, not copy your local .env
# (Avoid copying .env directly into the image for security)
# COPY .env .   ← DO NOT do this in production

# ✅ Expose the app port
EXPOSE 5000

# ✅ Start the server using Node.js
CMD ["npm", "start"]
