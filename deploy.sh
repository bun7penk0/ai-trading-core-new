#!/bin/bash
echo "=== AI Trading Core v0.6.4 Deploy ==="
curl -s ifconfig.me; echo " <- Static IP เอาไปใส่ Settrade"
if [ ! -f .env ]; then cp .env.example .env; fi
docker compose down
docker compose build
docker compose up -d
docker compose logs -f
