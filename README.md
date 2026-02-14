# phase3_run_20260214_201517

Project workspace (Phase 3 Build Orchestrator).

Backend API NestJS con autenticación (JWT, Google), RBAC (CASL) y administración de usuarios.

---

## Requisitos previos

- Node.js
- PostgreSQL
- Redis (para colas de email: forgot-password, etc.)

---

## Configuración

```bash
cd backend
cp .env.example .env
```

Editar `.env` y configurar al menos:

- **DATABASE_URL**: conexión a PostgreSQL (en macOS con Homebrew suele ser `postgresql://$(whoami)@localhost:5432/phase3_db?schema=public`)
- **JWT_SECRET**: clave para firmar tokens (cambiar en producción)
- **REDIS_HOST**, **REDIS_PORT**: si usas forgot-password o colas de email

---

## Puesta en marcha

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev   # crear BD y migraciones (nombre sugerido: init)
npx prisma db seed      # usuarios de prueba
```

---

## Ejecutar la API

```bash
cd backend
npm run build
npm run start           # servidor en http://localhost:3001
```

O en modo desarrollo (compilación en watch):

```bash
npm run start:dev       # Terminal 1: compilador
npm run start           # Terminal 2: servidor
```

---

## Probar la API

### Usuarios de prueba (tras `npx prisma db seed`)

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Test | test@test.com | password123 | — |
| Admin | admin@test.com | admin1234 | admin |

### Login (usuario normal)

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

### Login admin y listar usuarios

```bash
# Obtener token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin1234"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Listar usuarios
curl http://localhost:3001/admin/users -H "Authorization: Bearer $TOKEN"
```

### Otros endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /auth/login | Login email/contraseña |
| POST | /auth/google-login | Login con Google |
| POST | /auth/forgot-password | Recuperar contraseña |
| GET | /auth/sessions | Sesiones activas (requiere JWT) |
| DELETE | /auth/sessions/:id | Revocar sesión (requiere JWT) |
| GET | /admin/users | Listar usuarios (requiere admin) |
| POST | /admin/users | Crear usuario (requiere admin) |
| PATCH | /admin/users/:id | Actualizar usuario (requiere admin) |

---

## Tests

```bash
cd backend
npm test
```

---

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm run prisma:seed` | Ejecutar seed (crear usuarios de prueba) |
| `npm run prisma:migrate` | Aplicar migraciones |
| `npm run lint` | Linter |
| `npm run typecheck` | Verificación de tipos |
| `npm run test:cov` | Tests con cobertura |
