#!/bin/bash



# PRODUCTION
git reset --hard
git checkout master  # If branch is master
git pull origin master

# Update and rebuild container
# This command stops and removes the old container, then builds a new one
docker stop romimi-frontend
docker remove romimi-front
docker compose up -d --build

# Clean up unused old images
docker image prune -f

docker compose logs --tail 200 -f