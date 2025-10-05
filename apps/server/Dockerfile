FROM node
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application (frontend)
RUN node run.js

EXPOSE 4500

# Use the start:prod script from package.json
CMD ["npm", "run", "start:prod"]