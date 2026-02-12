import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Default roles as per DoD requirements
  const defaultRoles = [
    {
      name: 'admin_nacional',
      display_name: 'Administrador Nacional',
      description: 'Full system administrator with access to all features and settings at the national level',
      is_system: true,
      is_active: true,
    },
    {
      name: 'admin_institucional',
      display_name: 'Administrador Institucional',
      description: 'Institutional administrator with access to manage their assigned institution',
      is_system: true,
      is_active: true,
    },
    {
      name: 'docente',
      display_name: 'Docente',
      description: 'Teacher role with access to teaching-related features and student management',
      is_system: true,
      is_active: true,
    },
    {
      name: 'estudiante',
      display_name: 'Estudiante',
      description: 'Student role with access to learning materials and personal academic data',
      is_system: true,
      is_active: true,
    },
  ];

  console.log('📝 Creating default roles...');

  for (const role of defaultRoles) {
    const existingRole = await prisma.m01Role.findUnique({
      where: { name: role.name },
    });

    if (!existingRole) {
      await prisma.m01Role.create({
        data: role,
      });
      console.log(`  ✅ Created role: ${role.name}`);
    } else {
      console.log(`  ⏭️  Role already exists: ${role.name}`);
    }
  }

  console.log('🌱 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
