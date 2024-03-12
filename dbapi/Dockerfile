# Use the official Node.js 16 image as a parent image
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install -g npm@9.8.1
RUN npm install

# Bundle the source code inside the Docker image
COPY . .



# Command to run the application
CMD [ -d "node_modules" ] && npm run start || npm ci && npm run start