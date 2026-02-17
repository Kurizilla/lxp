# Demo LXP Flow – Cómo levantar el proyecto

## Estado actual

- **Redis**: Corriendo en Docker (`docker compose up -d redis`). Puerto 6379.
- **PostgreSQL**: Se usa tu instancia local (puerto 5432). Base de datos `phase3_db`.
- **Backend**: NestJS en **http://localhost:3001**
- **Frontend**: Vite + React en **http://localhost:3000**

## Accesos para la demo

| Rol      | Email             | Contraseña  |
|----------|-------------------|-------------|
| Admin    | admin@test.com    | Admin123!   |
| Teacher  | teacher@test.com  | Teacher123! |
| Student  | student@test.com  | Student123! |

## Comandos para levantar todo (próximas veces)

```bash
# 1. Bases de datos (si usas Docker para Redis; Postgres ya local)
cd /Users/gjkm9/github/goes/storymap-pipeline/projects/lxp-flow
docker compose up -d redis

# 2. Backend
cd backend
npm install
npx prisma generate
npm run build
npm start          # o: npm run start:dev

# 3. Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

## Solo Postgres + Redis con Docker (sin Postgres local)

Si quieres levantar también Postgres en Docker (por ejemplo en otra máquina):

1. En `backend/.env` pon:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/phase3_db?schema=public"
   ```
2. Levanta todos los servicios: `docker compose up -d`
3. En `backend`: `npx prisma migrate dev` y `npm run prisma:seed`

Nota: Si en tu máquina ya hay Postgres en el puerto 5432, el contenedor `postgres` fallará al arrancar; en ese caso usa solo `docker compose up -d redis` y deja Postgres local como está.
