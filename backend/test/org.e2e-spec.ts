import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma';
import * as bcrypt from 'bcrypt';

/**
 * E2E tests for Org endpoints (institutions, subjects, classrooms, enrollments)
 * 
 * These tests require a running PostgreSQL database.
 * Run with: npm run test:e2e
 */
describe('OrgController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let adminUserId: string;
  let testInstitutionId: string;
  let testSubjectId: string;
  let testClassroomId: string;

  const adminEmail = 'e2e-admin@test.com';
  const adminPassword = 'TestPassword123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Setup: Create admin user and role for testing
    await setupTestAdmin();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  async function setupTestAdmin() {
    // Create admin role if not exists
    const adminRole = await prisma.m01_roles.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Administrator role',
        is_system: true,
      },
    });

    // Create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const adminUser = await prisma.m01_users.upsert({
      where: { email: adminEmail },
      update: { password_hash: passwordHash },
      create: {
        email: adminEmail,
        password_hash: passwordHash,
        first_name: 'E2E',
        last_name: 'Admin',
        is_active: true,
      },
    });
    adminUserId = adminUser.id;

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
        granted_by: 'e2e-test',
      },
    });
  }

  async function cleanupTestData() {
    // Delete in reverse order of dependencies
    await prisma.m01_classroom_enrollments.deleteMany({
      where: { classroom: { name: { startsWith: 'E2E-' } } },
    });
    await prisma.m01_classrooms.deleteMany({
      where: { name: { startsWith: 'E2E-' } },
    });
    await prisma.m01_subjects.deleteMany({
      where: { code: { startsWith: 'E2E-' } },
    });
    await prisma.m01_institutions.deleteMany({
      where: { code: { startsWith: 'E2E-' } },
    });
    await prisma.m01_user_roles.deleteMany({
      where: { user: { email: adminEmail } },
    });
    await prisma.m01_user_sessions.deleteMany({
      where: { user: { email: adminEmail } },
    });
    await prisma.m01_users.deleteMany({
      where: { email: adminEmail },
    });
  }

  // ============================================================================
  // AUTH - Get token for subsequent tests
  // ============================================================================

  describe('Authentication', () => {
    it('POST /auth/login - should authenticate admin user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: adminEmail, password: adminPassword })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.user.email).toBe(adminEmail);
      accessToken = response.body.access_token;
    });
  });

  // ============================================================================
  // INSTITUTIONS
  // ============================================================================

  describe('Institutions CRUD', () => {
    it('GET /admin/institutions - should return empty list initially', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/institutions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.institutions).toBeDefined();
      expect(Array.isArray(response.body.institutions)).toBe(true);
      expect(response.body.total).toBeDefined();
      expect(response.body.offset).toBe(0);
      expect(response.body.limit).toBe(20);
    });

    it('POST /admin/institutions - should create institution', async () => {
      const createDto = {
        name: 'E2E-Universidad Test',
        code: 'E2E-UNI-001',
        address: 'Calle Test 123',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/institutions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.institution).toBeDefined();
      expect(response.body.institution.name).toBe(createDto.name);
      expect(response.body.institution.code).toBe(createDto.code);
      expect(response.body.institution.is_active).toBe(true);
      expect(response.body.message).toBe('Institution created successfully');
      testInstitutionId = response.body.institution.id;
    });

    it('POST /admin/institutions - should fail with duplicate code', async () => {
      const createDto = {
        name: 'E2E-Duplicate Institution',
        code: 'E2E-UNI-001', // Same code as above
      };

      await request(app.getHttpServer())
        .post('/admin/institutions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(409); // Conflict
    });

    it('GET /admin/institutions/:id - should return institution', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/institutions/${testInstitutionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.institution.id).toBe(testInstitutionId);
      expect(response.body.institution.code).toBe('E2E-UNI-001');
    });

    it('PATCH /admin/institutions/:id - should update institution', async () => {
      const updateDto = {
        name: 'E2E-Universidad Test Updated',
        address: 'Nueva Dirección 456',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/institutions/${testInstitutionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.institution.name).toBe(updateDto.name);
      expect(response.body.institution.address).toBe(updateDto.address);
      expect(response.body.message).toBe('Institution updated successfully');
    });

    it('GET /admin/institutions - should return list with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/institutions?offset=0&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.institutions.length).toBeGreaterThan(0);
      expect(response.body.offset).toBe(0);
      expect(response.body.limit).toBeDefined();
    });
  });

  // ============================================================================
  // SUBJECTS
  // ============================================================================

  describe('Subjects CRUD', () => {
    it('POST /admin/subjects - should create subject', async () => {
      const createDto = {
        code: 'E2E-MATH-101',
        name: 'E2E-Matemáticas I',
        description: 'Cálculo diferencial e integral',
        grade: '1',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/subjects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.subject).toBeDefined();
      expect(response.body.subject.code).toBe(createDto.code);
      expect(response.body.subject.name).toBe(createDto.name);
      expect(response.body.message).toBe('Subject created successfully');
      testSubjectId = response.body.subject.id;
    });

    it('GET /admin/subjects - should return subjects list', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/subjects')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.subjects).toBeDefined();
      expect(response.body.subjects.length).toBeGreaterThan(0);
    });

    it('GET /admin/subjects/:id - should return subject', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/subjects/${testSubjectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.subject.id).toBe(testSubjectId);
    });

    it('PATCH /admin/subjects/:id - should update subject', async () => {
      const updateDto = {
        description: 'Descripción actualizada',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/subjects/${testSubjectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.subject.description).toBe(updateDto.description);
    });
  });

  // ============================================================================
  // CLASSROOMS
  // ============================================================================

  describe('Classrooms CRUD', () => {
    it('POST /admin/classrooms - should create classroom', async () => {
      const createDto = {
        institution_id: testInstitutionId,
        subject_id: testSubjectId,
        name: 'E2E-Aula 101',
        section: 'A',
        academic_year: '2026',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/classrooms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.classroom).toBeDefined();
      expect(response.body.classroom.name).toBe(createDto.name);
      expect(response.body.classroom.institution.id).toBe(testInstitutionId);
      expect(response.body.classroom.subject.id).toBe(testSubjectId);
      expect(response.body.message).toBe('Classroom created successfully');
      testClassroomId = response.body.classroom.id;
    });

    it('POST /admin/classrooms - should fail with invalid institution_id', async () => {
      const createDto = {
        institution_id: '00000000-0000-0000-0000-000000000000',
        subject_id: testSubjectId,
        name: 'E2E-Invalid Classroom',
      };

      await request(app.getHttpServer())
        .post('/admin/classrooms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(400); // Bad Request - FK validation
    });

    it('GET /admin/classrooms - should return classrooms with relations', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/classrooms')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.classrooms.length).toBeGreaterThan(0);
      expect(response.body.classrooms[0].institution).toBeDefined();
      expect(response.body.classrooms[0].subject).toBeDefined();
    });

    it('PATCH /admin/classrooms/:id - should update classroom', async () => {
      const updateDto = {
        section: 'B',
        is_active: false,
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/classrooms/${testClassroomId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.classroom.section).toBe('B');
      expect(response.body.classroom.is_active).toBe(false);
    });

    // Re-activate for enrollment tests
    it('PATCH /admin/classrooms/:id - should reactivate classroom', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/classrooms/${testClassroomId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ is_active: true })
        .expect(200);
    });
  });

  // ============================================================================
  // ENROLLMENTS
  // ============================================================================

  describe('Enrollments CRUD', () => {
    let testEnrollmentId: string;

    it('POST /admin/enrollments - should enroll user in classroom', async () => {
      const createDto = {
        user_id: adminUserId,
        classroom_id: testClassroomId,
        role: 'teacher',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/enrollments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.enrollment).toBeDefined();
      expect(response.body.enrollment.role).toBe('teacher');
      expect(response.body.enrollment.user.id).toBe(adminUserId);
      expect(response.body.message).toBe('User enrolled successfully');
      testEnrollmentId = response.body.enrollment.id;
    });

    it('POST /admin/enrollments - should fail with duplicate enrollment', async () => {
      const createDto = {
        user_id: adminUserId,
        classroom_id: testClassroomId,
        role: 'student',
      };

      await request(app.getHttpServer())
        .post('/admin/enrollments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(409); // Conflict - already enrolled
    });

    it('GET /admin/classrooms/:id/enrollments - should list enrollments', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/classrooms/${testClassroomId}/enrollments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.enrollments).toBeDefined();
      expect(response.body.enrollments.length).toBeGreaterThan(0);
      expect(response.body.enrollments[0].user).toBeDefined();
    });

    it('PATCH /admin/enrollments/:id - should update enrollment role', async () => {
      const updateDto = {
        role: 'assistant',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/enrollments/${testEnrollmentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.enrollment.role).toBe('assistant');
    });

    it('PATCH /admin/enrollments/:id - should drop enrollment', async () => {
      const updateDto = {
        dropped: true,
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/enrollments/${testEnrollmentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.enrollment.dropped_at).not.toBeNull();
    });
  });

  // ============================================================================
  // ASSISTANT
  // ============================================================================

  describe('Assistant Query', () => {
    it('POST /assistant/query - should return stub response without context', async () => {
      const queryDto = {
        query: '¿Cómo agrego estudiantes?',
      };

      const response = await request(app.getHttpServer())
        .post('/assistant/query')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(queryDto)
        .expect(200);

      expect(response.body.response).toBeDefined();
      expect(response.body.response).toContain('[Stub]');
      expect(response.body.suggestions).toBeDefined();
      expect(Array.isArray(response.body.suggestions)).toBe(true);
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.context_used).toBe(false);
      expect(response.body.metadata.processed_at).toBeDefined();
    });

    it('POST /assistant/query - should return context-aware response for classroom route', async () => {
      const queryDto = {
        query: '¿Cómo agrego estudiantes?',
        route: '/teacher/classrooms',
        module: 'm01',
      };

      const response = await request(app.getHttpServer())
        .post('/assistant/query')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(queryDto)
        .expect(200);

      expect(response.body.response).toContain('[Stub]');
      expect(response.body.response).toContain('aulas');
      expect(response.body.route).toBe('/teacher/classrooms');
      expect(response.body.module).toBe('m01');
      expect(response.body.metadata.context_used).toBe(true);
      expect(response.body.suggestions).toContain('¿Cómo agregar estudiantes a un aula?');
    });

    it('POST /assistant/query - should return context-aware response for admin route', async () => {
      const queryDto = {
        query: '¿Cómo gestiono usuarios?',
        route: '/admin/users',
      };

      const response = await request(app.getHttpServer())
        .post('/assistant/query')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(queryDto)
        .expect(200);

      expect(response.body.response).toContain('[Stub]');
      expect(response.body.response).toContain('administración');
      expect(response.body.metadata.context_used).toBe(true);
      expect(response.body.suggestions).toContain('¿Cómo crear un nuevo usuario?');
    });

    it('POST /assistant/query - should validate empty query', async () => {
      const queryDto = {
        query: '',
      };

      await request(app.getHttpServer())
        .post('/assistant/query')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(queryDto)
        .expect(400);
    });

    it('POST /assistant/query - should reject without auth', async () => {
      await request(app.getHttpServer())
        .post('/assistant/query')
        .send({ query: 'test' })
        .expect(401);
    });
  });

  // ============================================================================
  // ADMIN CONFIG
  // ============================================================================

  describe('Admin Config', () => {
    it('GET /admin/config - should return current config', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/config')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.config).toBeDefined();
      expect(response.body.config.assistant_model).toBeDefined();
      expect(response.body.config.assistant_enabled).toBeDefined();
      expect(response.body.config.feature_flags).toBeDefined();
      expect(response.body.config.settings).toBeDefined();
      expect(response.body.config.updated_at).toBeDefined();
    });

    it('PATCH /admin/config - should update config', async () => {
      const updateDto = {
        assistant_model: 'gpt-3.5-turbo',
        assistant_enabled: false,
        feature_flags: { test_feature: true },
      };

      const response = await request(app.getHttpServer())
        .patch('/admin/config')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.config.assistant_model).toBe('gpt-3.5-turbo');
      expect(response.body.config.assistant_enabled).toBe(false);
      expect(response.body.config.feature_flags.test_feature).toBe(true);
      expect(response.body.message).toBe('Configuration updated successfully');
    });

    it('PATCH /admin/config - should merge feature_flags', async () => {
      const updateDto = {
        feature_flags: { another_feature: true },
      };

      const response = await request(app.getHttpServer())
        .patch('/admin/config')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      // Should have both features
      expect(response.body.config.feature_flags.test_feature).toBe(true);
      expect(response.body.config.feature_flags.another_feature).toBe(true);
    });

    it('PATCH /admin/config - should update system_prompt', async () => {
      const updateDto = {
        system_prompt: 'You are a helpful educational assistant.',
      };

      const response = await request(app.getHttpServer())
        .patch('/admin/config')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.config.system_prompt).toBe('You are a helpful educational assistant.');
    });

    it('GET /admin/config - should persist changes', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/config')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify previous updates persisted
      expect(response.body.config.assistant_model).toBe('gpt-3.5-turbo');
      expect(response.body.config.assistant_enabled).toBe(false);
      expect(response.body.config.feature_flags.test_feature).toBe(true);
      expect(response.body.config.feature_flags.another_feature).toBe(true);
      expect(response.body.config.system_prompt).toBe('You are a helpful educational assistant.');
    });

    it('GET /admin/config - should reject without auth', async () => {
      await request(app.getHttpServer())
        .get('/admin/config')
        .expect(401);
    });

    it('PATCH /admin/config - should reject without auth', async () => {
      await request(app.getHttpServer())
        .patch('/admin/config')
        .send({ assistant_enabled: true })
        .expect(401);
    });
  });

  // ============================================================================
  // AUTHORIZATION
  // ============================================================================

  describe('Authorization', () => {
    it('should reject requests without token', async () => {
      await request(app.getHttpServer())
        .get('/admin/institutions')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/admin/institutions')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
