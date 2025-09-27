# Use Node.js 20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install
RUN cd backend && npm install

# Copy source code
COPY backend/ ./backend/

# Build the application
RUN cd backend && npm run build:prod

# Expose port
EXPOSE 5002

# Start the application
WORKDIR /app/backend
CMD ["npm", "start"]
