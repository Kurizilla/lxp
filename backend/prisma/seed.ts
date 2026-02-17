import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create roles
  const adminRole = await prisma.m01_roles.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
      is_system: true,
    },
  });
  console.log('✅ Created admin role:', adminRole.id);

  const teacherRole = await prisma.m01_roles.upsert({
    where: { name: 'teacher' },
    update: {},
    create: {
      name: 'teacher',
      description: 'Teacher role',
      is_system: true,
    },
  });
  console.log('✅ Created teacher role:', teacherRole.id);

  const studentRole = await prisma.m01_roles.upsert({
    where: { name: 'student' },
    update: {},
    create: {
      name: 'student',
      description: 'Student role',
      is_system: true,
    },
  });
  console.log('✅ Created student role:', studentRole.id);

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const adminUser = await prisma.m01_users.upsert({
    where: { email: 'admin@test.com' },
    update: { password_hash: adminPasswordHash },
    create: {
      email: 'admin@test.com',
      password_hash: adminPasswordHash,
      first_name: 'Admin',
      last_name: 'User',
      is_active: true,
    },
  });
  console.log('✅ Created admin user:', adminUser.email);

  // Asegurar que admin@test.com solo tenga rol admin (quitar teacher u otros si se asignaron por error)
  await prisma.m01_user_roles.deleteMany({
    where: {
      user_id: adminUser.id,
      role_id: { not: adminRole.id },
    },
  });

  // Assign admin role
  await prisma.m01_user_roles.upsert({
    where: {
      user_id_role_id: {
        user_id: adminUser.id,
        role_id: adminRole.id,
      },
    },
    update: {},
    create: {
      user_id: adminUser.id,
      role_id: adminRole.id,
      granted_by: 'seed',
    },
  });
  console.log('✅ Assigned admin role to admin user');

  // Create teacher user
  const teacherPasswordHash = await bcrypt.hash('Teacher123!', 10);
  const teacherUser = await prisma.m01_users.upsert({
    where: { email: 'teacher@test.com' },
    update: { password_hash: teacherPasswordHash },
    create: {
      email: 'teacher@test.com',
      password_hash: teacherPasswordHash,
      first_name: 'Test',
      last_name: 'Teacher',
      is_active: true,
    },
  });
  console.log('✅ Created teacher user:', teacherUser.email);

  // Assign teacher role
  await prisma.m01_user_roles.upsert({
    where: {
      user_id_role_id: {
        user_id: teacherUser.id,
        role_id: teacherRole.id,
      },
    },
    update: {},
    create: {
      user_id: teacherUser.id,
      role_id: teacherRole.id,
      granted_by: 'seed',
    },
  });
  console.log('✅ Assigned teacher role to teacher user');

  // Create test institution
  const institution = await prisma.m01_institutions.upsert({
    where: { code: 'TEST-001' },
    update: {},
    create: {
      name: 'Test Institution',
      code: 'TEST-001',
      address: '123 Test Street',
      is_active: true,
    },
  });
  console.log('✅ Created institution:', institution.name);

  // Assign teacher to institution
  await prisma.m01_user_institutions.upsert({
    where: {
      user_id_institution_id: {
        user_id: teacherUser.id,
        institution_id: institution.id,
      },
    },
    update: {},
    create: {
      user_id: teacherUser.id,
      institution_id: institution.id,
      role_context: 'teacher',
    },
  });
  console.log('✅ Assigned teacher to institution');

  // Create test subject
  const subject = await prisma.m01_subjects.upsert({
    where: { code: 'MATH-101' },
    update: {},
    create: {
      code: 'MATH-101',
      name: 'Mathematics I',
      description: 'Introduction to Mathematics',
      grade: '10',
      is_active: true,
    },
  });
  console.log('✅ Created subject:', subject.name);

  // Create test classroom
  const classroom = await prisma.m01_classrooms.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      institution_id: institution.id,
      subject_id: subject.id,
      name: 'Math 101 - Section A',
      section: 'A',
      academic_year: '2026',
      is_active: true,
    },
  });
  console.log('✅ Created classroom:', classroom.name);

  // Enroll teacher in classroom
  await prisma.m01_classroom_enrollments.upsert({
    where: {
      user_id_classroom_id: {
        user_id: teacherUser.id,
        classroom_id: classroom.id,
      },
    },
    update: {},
    create: {
      user_id: teacherUser.id,
      classroom_id: classroom.id,
      role: 'teacher',
    },
  });
  console.log('✅ Enrolled teacher in classroom');

  // Create student user (for testing role restrictions)
  const studentPasswordHash = await bcrypt.hash('Student123!', 10);
  const studentUser = await prisma.m01_users.upsert({
    where: { email: 'student@test.com' },
    update: { password_hash: studentPasswordHash },
    create: {
      email: 'student@test.com',
      password_hash: studentPasswordHash,
      first_name: 'Test',
      last_name: 'Student',
      is_active: true,
    },
  });
  console.log('✅ Created student user:', studentUser.email);

  // Assign student role
  await prisma.m01_user_roles.upsert({
    where: {
      user_id_role_id: {
        user_id: studentUser.id,
        role_id: studentRole.id,
      },
    },
    update: {},
    create: {
      user_id: studentUser.id,
      role_id: studentRole.id,
      granted_by: 'seed',
    },
  });
  console.log('✅ Assigned student role to student user');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('Test accounts:');
  console.log('  Admin:   admin@test.com / Admin123!');
  console.log('  Teacher: teacher@test.com / Teacher123!');
  console.log('  Student: student@test.com / Student123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
