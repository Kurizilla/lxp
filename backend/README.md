# Backend API - LXP Flow

API backend construida con NestJS para el sistema LXP (Learning Experience Platform).

## Stack Tecnológico

- **Framework**: NestJS 10
- **Lenguaje**: TypeScript 5
- **Base de datos**: PostgreSQL 16
- **ORM**: Prisma 5
- **Autenticación**: JWT + Passport
- **Autorización**: CASL (Attribute-Based Access Control)
- **Colas**: Bull + Redis

## Requisitos

- Node.js >= 18
- PostgreSQL 16
- Redis (para Bull queues)

## Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus configuraciones
# DATABASE_URL, JWT_SECRET, REDIS_HOST, etc.

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Compilar
npm run build

# Iniciar servidor
npm start
```

## Quick Setup (Desarrollo)

Para configurar rápidamente el entorno de desarrollo con datos de prueba:

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env (copiar y editar)
cp .env.example .env

# 3. Setup completo (migraciones + seed)
npm run db:setup

# 4. Iniciar servidor
npm start
```

Esto crea automáticamente:
- **Roles**: admin, teacher, student
- **Usuario Admin**: `admin@test.com` / `Admin123!`
- **Usuario Teacher**: `teacher@test.com` / `Teacher123!`
- **Institución de prueba**: TEST-001
- **Materia de prueba**: MATH-101
- **Aula de prueba**: Math 101 - Section A
- **Teacher asignado a institución y aula**

### Resetear Base de Datos

```bash
# Resetear y re-seedear
npm run prisma:reset
```

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compila TypeScript a JavaScript |
| `npm start` | Inicia el servidor en producción |
| `npm run start:dev` | Inicia en modo desarrollo (watch) |
| `npm run lint` | Ejecuta ESLint |
| `npm test` | Ejecuta tests unitarios |
| `npm run test:e2e` | Ejecuta tests de integración (e2e) |
| `npm run test:cov` | Tests con cobertura |
| `npm run typecheck` | Verifica tipos TypeScript |

## Estructura del Proyecto

```
backend/
├── src/
│   ├── common/           # Módulos compartidos
│   │   ├── prisma/       # Servicio Prisma
│   │   └── filters/      # Filtros de excepciones
│   ├── m01/              # Módulo M01 (Auth & Org)
│   │   ├── auth/         # Autenticación (login, JWT)
│   │   ├── admin/        # Admin de usuarios y roles
│   │   ├── org/          # Instituciones, materias, aulas
│   │   ├── casl/         # Factory de permisos CASL
│   │   ├── guards/       # Guards de autorización
│   │   └── dto/          # Data Transfer Objects
│   ├── app.module.ts     # Módulo raíz
│   └── main.ts           # Entry point
├── prisma/
│   └── schema.prisma     # Esquema de base de datos
├── test/
│   ├── jest-e2e.json     # Config Jest para e2e
│   └── org.e2e-spec.ts   # Tests e2e de Org
└── package.json
```

## Endpoints de la API

### Autenticación (`/auth`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/login` | Login con email/password |
| POST | `/auth/google-login` | Login con Google OAuth |
| POST | `/auth/forgot-password` | Solicitar reset de password |
| GET | `/auth/sessions` | Listar sesiones del usuario |
| DELETE | `/auth/sessions/:id` | Revocar una sesión |

### Admin - Usuarios (`/admin`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/users` | Listar usuarios (paginado) |
| GET | `/admin/users/:id` | Obtener usuario |
| POST | `/admin/users` | Crear usuario |
| PATCH | `/admin/users/:id` | Actualizar usuario |
| POST | `/admin/users/:id/roles` | Asignar roles |
| POST | `/admin/roles/:id/permissions` | Asignar permisos a rol |
| GET | `/admin/sessions/users/:id` | Ver sesiones de usuario |

### Admin - Instituciones (`/admin`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/institutions` | Listar instituciones |
| GET | `/admin/institutions/:id` | Obtener institución |
| POST | `/admin/institutions` | Crear institución |
| PATCH | `/admin/institutions/:id` | Actualizar institución |

### Admin - Materias (`/admin`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/subjects` | Listar materias |
| GET | `/admin/subjects/:id` | Obtener materia |
| POST | `/admin/subjects` | Crear materia |
| PATCH | `/admin/subjects/:id` | Actualizar materia |

### Admin - Aulas (`/admin`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/classrooms` | Listar aulas |
| GET | `/admin/classrooms/:id` | Obtener aula |
| POST | `/admin/classrooms` | Crear aula |
| PATCH | `/admin/classrooms/:id` | Actualizar aula |
| GET | `/admin/classrooms/:id/enrollments` | Listar matrículas |

### Admin - Matrículas (`/admin`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/admin/enrollments` | Matricular usuario en aula |
| PATCH | `/admin/enrollments/:id` | Actualizar matrícula |

### Teacher (`/teacher`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/teacher/institutions` | Listar instituciones asignadas al teacher |
| GET | `/teacher/classrooms` | Listar aulas donde es teacher |
| GET | `/teacher/classrooms?institution_id=<uuid>` | Filtrar aulas por institución |

## Paginación

Los endpoints de listado soportan paginación mediante query params:

```
GET /admin/institutions?offset=0&limit=20
```

Respuesta:
```json
{
  "institutions": [...],
  "total": 100,
  "offset": 0,
  "limit": 20
}
```

## Autenticación

Todos los endpoints `/admin/*` requieren autenticación JWT.

```bash
# 1. Obtener token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "Admin123!"}'

# 2. Usar token en peticiones
curl http://localhost:3001/admin/institutions \
  -H "Authorization: Bearer <token>"
```

## Probar Teacher Endpoints

### Opción 1: Script automático (recomendado)

```bash
# Asegúrate de que el servidor esté corriendo
npm start &

# Ejecutar tests de teacher endpoints
npm run test:teacher

# O especificar puerto
npm run test:teacher 3002
```

El script prueba:
- ✅ Login como teacher
- ✅ GET /teacher/institutions
- ✅ GET /teacher/classrooms
- ✅ Filtro por institution_id
- ✅ Validación de UUID inválido
- ✅ Acceso sin token (401)
- ✅ Acceso con rol student (403)

### Opción 2: Manual con curl

```bash
# 1. Login como teacher
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@test.com", "password": "Teacher123!"}' | jq -r '.access_token')

# 2. Obtener instituciones del teacher
curl http://localhost:3001/teacher/institutions \
  -H "Authorization: Bearer $TOKEN"

# 3. Obtener aulas del teacher
curl http://localhost:3001/teacher/classrooms \
  -H "Authorization: Bearer $TOKEN"

# 4. Filtrar aulas por institución
curl "http://localhost:3001/teacher/classrooms?institution_id=<uuid>" \
  -H "Authorization: Bearer $TOKEN"
```

## Ejecutar Tests

### Tests Unitarios

```bash
npm test
```

### Tests E2E (Integración)

Los tests e2e requieren una base de datos PostgreSQL corriendo.

```bash
# Asegúrate de que la BD esté configurada en .env
npm run test:e2e
```

Los tests e2e:
- Crean un usuario admin temporal
- Prueban todos los endpoints CRUD
- Verifican validaciones y autorizaciones
- Limpian los datos al finalizar

## Crear Usuario Admin (Manual)

Si necesitas crear un usuario admin manualmente:

```bash
# 1. Generar hash de password
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('TuPassword123!', 10).then(h => console.log(h));"

# 2. Insertar en BD
psql -d phase3_db << 'EOF'
INSERT INTO m01_roles (id, name, description, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'admin', 'Administrator', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO m01_users (id, email, password_hash, first_name, last_name, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@test.com',
  '<hash-generado>',
  'Admin',
  'User',
  true,
  NOW(),
  NOW()
);

INSERT INTO m01_user_roles (id, user_id, role_id, granted_by, granted_at)
SELECT gen_random_uuid(), u.id, r.id, 'manual', NOW()
FROM m01_users u, m01_roles r
WHERE u.email = 'admin@test.com' AND r.name = 'admin';
EOF
```

## Ejemplos de Uso

### Crear Institución

```bash
curl -X POST http://localhost:3001/admin/institutions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Universidad Nacional",
    "code": "UNAL-001",
    "address": "Calle Principal 123"
  }'
```

### Crear Materia

```bash
curl -X POST http://localhost:3001/admin/subjects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "MATH-101",
    "name": "Matemáticas I",
    "description": "Cálculo diferencial",
    "grade": "1"
  }'
```

### Crear Aula

```bash
curl -X POST http://localhost:3001/admin/classrooms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": "<uuid-institucion>",
    "subject_id": "<uuid-materia>",
    "name": "Aula 101",
    "section": "A",
    "academic_year": "2026"
  }'
```

### Matricular Usuario

```bash
curl -X POST http://localhost:3001/admin/enrollments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<uuid-usuario>",
    "classroom_id": "<uuid-aula>",
    "role": "student"
  }'
```

## Variables de Entorno

Ver `.env.example` para la lista completa de variables requeridas.

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión PostgreSQL |
| `JWT_SECRET` | Secret para firmar tokens JWT |
| `JWT_EXPIRES_IN` | Duración del token (ej: "24h") |
| `REDIS_HOST` | Host de Redis |
| `REDIS_PORT` | Puerto de Redis |
| `PORT` | Puerto del servidor (default: 3001) |

## Contribuir

1. Crear rama desde `main`
2. Implementar cambios
3. Asegurar que tests pasen: `npm test && npm run test:e2e`
4. Asegurar que lint pase: `npm run lint`
5. Crear PR con descripción detallada
