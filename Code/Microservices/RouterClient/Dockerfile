# Use the official Node.js 18 image as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /router-client

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the client application code to the container
COPY . .

# Expose the port if your client runs on a specific port
# For example, if your router client has an API or web interface
EXPOSE 3000  

# Define the command to run your router client application
CMD ["node", "dist/app.js"]
