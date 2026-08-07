# Manager Hub

![Tests](https://github.com/michellekuitang/manager-hub/actions/workflows/tests.yml/badge.svg)

Application web de suivi des tournages et du planning marketing — ESIIA

## Stack technique
- Frontend : React 18 + React Router + Axios + Tailwind CSS
- Backend : Node.js + Express.js + JWT + bcrypt + Mongoose
- Base de données : MongoDB (NoSQL)
- Conteneurisation : Docker + Docker Compose

## Lancer le projet
```bash
docker-compose up --build
```

## Structure
```
manager-hub/
├── frontend/     # Application React
├── backend/      # API REST Express
└── docs/         # Diagrammes et documentation
```