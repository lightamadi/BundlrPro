#!/bin/bash

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '#' | xargs)
fi

# Check if MongoDB is running
echo "Checking MongoDB connection..."
mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Error: MongoDB is not running. Please start MongoDB first."
  exit 1
fi

# Initialize database if needed
echo "Initializing database..."
npm run init-db

# Start development server
echo "Starting development server..."
npm run dev 