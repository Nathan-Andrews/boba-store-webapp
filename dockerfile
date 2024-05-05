# Use Node.js as a base image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json from backend and install dependencies
COPY backend/package*.json ./backend/
WORKDIR /usr/src/app/backend
RUN npm install

# Copy backend source files and build TypeScript files
COPY backend/ ./
RUN npm run build

# Change directory to frontend, copy package files, and install dependencies
WORKDIR /usr/src/app/frontend
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source files and build the React application
COPY frontend/ ./
RUN npm run build

# Set work directory to backend for starting the application
WORKDIR /usr/src/app/backend

# Command to run the application
CMD ["npm", "start"]