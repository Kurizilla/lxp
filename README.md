# lxp-flow

Project workspace (Phase 3 Build Orchestrator).

## Development

### Backend (NestJS + Prisma)

```bash
cd backend
cp .env.example .env   # Editar DATABASE_URL con tu conexión PostgreSQL
npm install
npx prisma generate
npm run build
```

### Validar antes de PR

Ejecutar estos comandos antes de abrir un PR:

```bash
cd backend
npx prisma validate
npx prisma generate
npm run build
```

Requiere `DATABASE_URL` en `.env` o en el entorno (puede ser una URL dummy para `validate`).

### Convenciones Prisma (multiSchema)

- **Todos los modelos y enums** deben tener `@@schema("public")` o `@@schema("m01_establecimiento")` según corresponda.
- Sin `@@schema`, Prisma falla en `validate` con modo `multiSchema`.
- Usar `snake_case` para nombres de columnas (o `@map("snake_case")` si el campo es camelCase).
