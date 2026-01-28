#!/bin/bash



# PRODUCTION
git reset --hard
git checkout master  # Agar branchingiz main bo'lsa
git pull origin master

# Konteynerni yangilash va qayta qurish
# Bu buyruq eski konteynerni to'xtatadi, o'chiradi va yangisini build qiladi
docker stop romimi-frontend
docker remove romimi-front
docker compose up -d --build

# Keraksiz eski image'larni tozalash
docker image prune -f