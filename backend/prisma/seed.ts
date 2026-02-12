import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default roles...');

  // Default roles as per Definition of Done
  const defaultRoles = [
    {
      name: 'admin_nacional',
      description: 'Administrador Nacional - Acceso total al sistema',
      is_system: true,
      is_active: true,
    },
    {
      name: 'admin_institucional',
      description: 'Administrador Institucional - Gestión de institución específica',
      is_system: true,
      is_active: true,
    },
    {
      name: 'docente',
      description: 'Docente - Gestión de cursos y evaluaciones',
      is_system: true,
      is_active: true,
    },
    {
      name: 'estudiante',
      description: 'Estudiante - Acceso a recursos educativos',
      is_system: true,
      is_active: true,
    },
  ];

  for (const role of defaultRoles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: role.name },
    });

    if (!existingRole) {
      await prisma.role.create({
        data: role,
      });
      console.log(`Created role: ${role.name}`);
    } else {
      console.log(`Role already exists: ${role.name}`);
    }
  }

  console.log('Seeding completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
