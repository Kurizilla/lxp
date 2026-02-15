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

### Notificaciones (`/notifications`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/notifications` | Crear notificación |
| GET | `/notifications` | Listar notificaciones del usuario |
| GET | `/notifications?unread_only=true` | Filtrar solo no leídas |
| GET | `/notifications?priority=high` | Filtrar por prioridad |
| GET | `/notifications?type=announcement` | Filtrar por tipo |
| GET | `/notifications?limit=10&offset=0` | Paginación |
| PATCH | `/notifications/:id/read` | Marcar como leída |
| GET | `/notifications/preferences` | Ver preferencias de notificación |
| PATCH | `/notifications/preferences` | Actualizar preferencias |

#### Tipos de notificación
- `system` - Notificaciones del sistema
- `announcement` - Anuncios
- `reminder` - Recordatorios
- `alert` - Alertas
- `message` - Mensajes

#### Prioridades
- `low` - Baja
- `normal` - Normal
- `high` - Alta
- `urgent` - Urgente

#### Canales (para preferencias)
- `in_app` - En la aplicación
- `email` - Correo electrónico
- `push` - Notificaciones push
- `sms` - SMS

### Asistente IA (`/assistant`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/assistant/query` | Consulta al asistente con respuesta contextual |

#### Request Body para `/assistant/query`
```json
{
  "query": "¿Cómo agrego estudiantes?",
  "route": "/teacher/classrooms",
  "module": "m01",
  "classroom_id": "<uuid>",
  "subject_id": "<uuid>",
  "context": {}
}
```

- `query` (requerido): La consulta del usuario
- `route` (opcional): Ruta actual en la aplicación (ej: `/admin/users`, `/teacher/classrooms`)
- `module` (opcional): Módulo actual (ej: `m01`, `content`, `assessment`)
- `classroom_id` (opcional): UUID del aula actual
- `subject_id` (opcional): UUID de la materia actual
- `context` (opcional): Objeto con contexto adicional

#### Response
```json
{
  "response": "[Stub] Información sobre aulas...",
  "route": "/teacher/classrooms",
  "module": "m01",
  "suggestions": [
    "¿Cómo agregar estudiantes a un aula?",
    "¿Cómo ver el progreso del curso?",
    "¿Cómo configurar horarios?"
  ],
  "metadata": {
    "processed_at": "2026-02-14T22:47:58.678Z",
    "context_used": true
  }
}
```

El asistente devuelve respuestas contextuales basadas en:
- **route**: Si incluye `classroom`, `admin`, `subject`, `notification`, etc.
- **module**: Si es `m01` (auth), `content`, `assessment`, `analytics`, etc.

### Offline Sync (`/m09/offline`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/m09/offline/push` | Push operaciones offline (client → server) |
| POST | `/m09/offline/pull` | Pull cambios del servidor (server → client) |
| GET | `/m09/offline/status` | Estado del sync (pending, synced, failed, conflicts) |
| GET | `/m09/offline/conflicts` | Listar conflictos de versión |
| PATCH | `/m09/offline/conflicts/resolve` | Resolver un conflicto |
| PATCH | `/m09/offline/conflicts/resolve-bulk` | Resolver múltiples conflictos |
| DELETE | `/m09/offline/history` | Limpiar historial de operaciones sincronizadas |

#### Request Body para `POST /m09/offline/push`
```json
{
  "operations": [
    {
      "entity_type": "whiteboard_element",
      "entity_id": "<uuid>",
      "operation_type": "create|update|delete",
      "payload": { ... },
      "client_version": 1,
      "client_timestamp": "2026-02-15T19:00:00.000Z"
    }
  ],
  "last_sync_timestamp": 1739646000000
}
```

#### Response para `POST /m09/offline/push`
```json
{
  "synced": [
    {
      "id": "<queue-item-id>",
      "entity_type": "whiteboard_element",
      "entity_id": "<uuid>",
      "operation_type": "create",
      "status": "synced",
      "server_version": 1,
      "synced_at": "2026-02-15T19:05:00.000Z"
    }
  ],
  "conflicts": [
    {
      "id": "<conflict-id>",
      "entity_type": "whiteboard_element",
      "entity_id": "<uuid>",
      "client_version": 1,
      "server_version": 2,
      "client_data": { ... },
      "server_data": { ... },
      "has_version_conflict": true
    }
  ],
  "failed": [],
  "sync_timestamp": 1739646300000,
  "message": "Processed 2 operations"
}
```

#### Request Body para `PATCH /m09/offline/conflicts/resolve`
```json
{
  "conflict_id": "<uuid>",
  "resolution": "client_wins|server_wins|merged|discarded",
  "merged_data": { ... }
}
```

### Admin - Configuración (`/admin`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/config` | Obtener configuración actual |
| PATCH | `/admin/config` | Actualizar configuración |

#### Request Body para `PATCH /admin/config`
```json
{
  "assistant_model": "gpt-4",
  "assistant_enabled": true,
  "system_prompt": "Eres un asistente educativo...",
  "feature_flags": {
    "beta_features": true,
    "new_ui": false
  },
  "settings": {
    "max_tokens": 1000
  }
}
```

Todos los campos son opcionales. Los objetos `feature_flags` y `settings` se mezclan con los valores existentes.

#### Response
```json
{
  "config": {
    "assistant_model": "gpt-4",
    "assistant_enabled": true,
    "system_prompt": "Eres un asistente educativo...",
    "feature_flags": {"beta_features": true},
    "settings": {"max_tokens": 1000},
    "updated_at": "2026-02-14T22:48:05.979Z"
  },
  "message": "Configuration updated successfully"
}
```

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

## Probar Notifications Endpoints

### Opción 1: Script automático (recomendado)

```bash
# Asegúrate de que el servidor esté corriendo
npm start &

# Ejecutar tests de notifications
npm run test:notifications

# O especificar puerto
npm run test:notifications 3002
```

El script prueba:
- ✅ Login como admin
- ✅ GET /notifications (lista vacía inicial)
- ✅ GET /notifications/preferences
- ✅ POST /notifications (crear)
- ✅ GET /notifications (con notificación creada)
- ✅ Filtro unread_only=true
- ✅ Filtro priority=high
- ✅ PATCH /notifications/:id/read (marcar leída)
- ✅ PATCH /notifications/:id/read (ya leída)
- ✅ PATCH /notifications/preferences (actualizar)
- ✅ Validación recipient_ids inválidos
- ✅ 404 para notificación no existente
- ✅ 401 sin token
- ✅ Paginación (limit, offset)

### Opción 2: Manual con curl

```bash
# 1. Login para obtener token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "Admin123!"}' | jq -r '.access_token')

# 2. Obtener ID del usuario (está en el token)
ADMIN_ID=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "Admin123!"}' | jq -r '.user.id')

# 3. Crear notificación
curl -X POST http://localhost:3001/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Bienvenido al sistema\",
    \"message\": \"Esta es tu primera notificación\",
    \"type\": \"announcement\",
    \"priority\": \"normal\",
    \"recipient_ids\": [\"$ADMIN_ID\"]
  }"

# 4. Listar notificaciones
curl http://localhost:3001/notifications \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. Filtrar solo no leídas
curl "http://localhost:3001/notifications?unread_only=true" \
  -H "Authorization: Bearer $TOKEN" | jq

# 6. Filtrar por prioridad
curl "http://localhost:3001/notifications?priority=high" \
  -H "Authorization: Bearer $TOKEN" | jq

# 7. Marcar como leída (reemplazar NOTIFICATION_ID)
curl -X PATCH http://localhost:3001/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer $TOKEN" | jq

# 8. Ver preferencias
curl http://localhost:3001/notifications/preferences \
  -H "Authorization: Bearer $TOKEN" | jq

# 9. Actualizar preferencias
curl -X PATCH http://localhost:3001/notifications/preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": [
      {"type": "announcement", "channel": "in_app", "enabled": true},
      {"type": "system", "channel": "email", "enabled": false}
    ]
  }' | jq
```

## Probar Offline Sync Endpoints

### Opción 1: Script automático (recomendado)

```bash
# Asegúrate de que el servidor esté corriendo
npm start &

# Ejecutar tests de offline sync
npm run test:offline

# O especificar puerto
npm run test:offline 3002
```

El script prueba:
- ✅ Login como admin
- ✅ GET /m09/offline/status (estado inicial)
- ✅ GET /m09/offline/conflicts (vacío)
- ✅ POST /m09/offline/push (operación create)
- ✅ POST /m09/offline/push (múltiples operaciones)
- ✅ POST /m09/offline/pull (obtener cambios)
- ✅ GET /m09/offline/status (después de operaciones)
- ✅ Validación 401 sin token
- ✅ GET /m09/offline/conflicts con filtros
- ✅ DELETE /m09/offline/history

### Opción 2: Manual con curl

```bash
# 1. Login para obtener token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "Admin123!"}' | jq -r '.access_token')

# 2. Ver estado del sync
curl http://localhost:3001/m09/offline/status \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Push operación offline
curl -X POST http://localhost:3001/m09/offline/push \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [{
      "entity_type": "whiteboard_element",
      "operation_type": "create",
      "payload": {"content": "test", "position_x": 100},
      "client_version": 1,
      "client_timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
    }]
  }' | jq

# 4. Pull cambios del servidor
curl -X POST http://localhost:3001/m09/offline/pull \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}' | jq

# 5. Ver conflictos
curl http://localhost:3001/m09/offline/conflicts \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

### Opción 2: Manual con curl (Teacher)

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

## Setup Completo desde Cero (Nuevo Desarrollador/Agente)

Si es tu primera vez o tienes problemas, sigue estos pasos en orden:

```bash
# 1. Clonar y entrar al directorio
cd backend

# 2. Crear archivo .env
cp .env.example .env
# Editar .env con tu DATABASE_URL (ej: postgresql://user@localhost:5432/phase3_db)

# 3. Eliminar cualquier estado previo problemático
rm -rf node_modules package-lock.json
rm -f prisma/.env  # Si existe, causa conflictos

# 4. Instalar dependencias
npm install

# 5. Generar cliente Prisma
npx prisma generate

# 6. Verificar que el cliente tiene los modelos
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); console.log('Models:', Object.keys(p).filter(k => k.startsWith('m0')).length);"
# Debe mostrar: Models: 21 (o más)

# 7. Crear/resetear base de datos
createdb phase3_db  # Si no existe
npx prisma migrate dev --name init
# Si hay drift, responder 'y' para resetear

# 8. Verificar con tests
npm run test:e2e
# Debe pasar 48+ tests
```

### Comandos de Emergencia

```bash
# Si todo falla, nuclear option:
rm -rf node_modules package-lock.json prisma/migrations
npm install
npx prisma generate
npx prisma migrate dev --name full_schema
npm run prisma:seed
npm run test:e2e
```

---

## Troubleshooting - Problemas Comunes

### Error: "Property 'm01_roles' does not exist on type 'PrismaClient'"

Este error ocurre cuando el cliente Prisma no está sincronizado con el schema. Solución:

```bash
# 1. Eliminar node_modules y regenerar todo
rm -rf node_modules package-lock.json
npm install
npx prisma generate

# 2. Verificar que el cliente tiene los modelos
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); console.log('m01_roles:', typeof p.m01_roles);"
# Debe imprimir: m01_roles: object
```

### Error: "The table does not exist in the current database"

La base de datos no tiene las tablas. Necesitas correr las migraciones:

```bash
# Opción 1: Si tienes migraciones existentes
npx prisma migrate dev

# Opción 2: Si hay conflictos, resetear todo (BORRA DATOS)
rm -rf prisma/migrations
npx prisma migrate dev --name full_schema
```

### Error: "Drift detected" o "Migration missing from local directory"

Hay diferencias entre la BD y las migraciones locales:

```bash
# Resetear la BD y crear nueva migración
npx prisma migrate reset --force
```

### Error: "Environment variable not found: DATABASE_URL"

Falta el archivo `.env`. Crear uno:

```bash
cp .env.example .env
# Editar .env con tu DATABASE_URL
```

### Error: "Conflicting env vars" (prisma/.env vs .env)

Hay dos archivos .env. Eliminar el de prisma:

```bash
rm prisma/.env
```

---

## Para Agentes y Desarrolladores (DB Tasks)

### Paso a Paso para Tasks de Base de Datos/Prisma

Cuando trabajes en una task que modifica el schema de Prisma, sigue estos pasos:

#### 1. Verificar el estado actual

```bash
# Ver líneas del schema (debe coincidir con lo esperado)
wc -l prisma/schema.prisma

# Verificar que el schema es válido
npx prisma validate
```

#### 2. Hacer cambios al schema

Editar `prisma/schema.prisma` siguiendo las convenciones:
- **Nombres de tablas**: `m{XX}_{nombre}` (ej: `m09_calendars`)
- **Campos**: snake_case (ej: `created_at`, `session_id`)
- **Siempre incluir**: índices en `session_id`, `created_at`, y campos de búsqueda frecuente

#### 3. Validar y generar cliente

```bash
npx prisma validate
npx prisma generate
npm run typecheck
```

#### 4. Crear migración (si aplica)

```bash
npx prisma migrate dev --name descriptive_name
```

#### 5. Health checks antes de commit

```bash
npx prisma validate       # Schema válido
npx prisma generate       # Cliente generado
npm run typecheck         # TypeScript compila
```

### Verificar Modelos M09 (Calendars & Modo Clase)

```bash
# Verificar que las tablas M09 existen en el cliente
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const m09 = Object.keys(p).filter(k => k.startsWith('m09_'));
console.log('M09 models:', m09.join(', '));
"
# Debe mostrar: m09_calendars, m09_calendar_events, m09_class_sessions, etc.
```

### Schema de Módulos

| Módulo | Prefijo | Descripción |
|--------|---------|-------------|
| M01 | `m01_` | Auth, Users, Roles, Organizations |
| M09 | `m09_` | Calendars, Modo Clase, Whiteboards |

### Tablas M09 (Calendars & Modo Clase)

| Tabla | Descripción |
|-------|-------------|
| `m09_calendars` | Calendario por aula |
| `m09_calendar_events` | Eventos con recurrencia |
| `m09_class_sessions` | Sesiones "modo clase" en vivo |
| `m09_class_session_participants` | Participantes en sesiones |
| `m09_class_session_state_logs` | Log de cambios de estado |
| `m09_whiteboards` | Pizarras por sesión |
| `m09_whiteboard_elements` | Elementos de pizarra |
| `m09_offline_queue` | Cola de operaciones offline |
| `m09_sync_conflicts` | Conflictos de versión en sync |

---

## Contribuir

1. Crear rama desde `main`
2. Implementar cambios
3. Asegurar que tests pasen: `npm test && npm run test:e2e`
4. Asegurar que lint pase: `npm run lint`
5. Crear PR con descripción detallada
