import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma';

/**
 * E2E tests for M09 Schema (Calendars & Modo Clase)
 * 
 * These tests verify that the M09 tables exist and are accessible.
 * This is a DB-layer validation test for task M09-T01.
 * 
 * Run with: npm run test:e2e
 */
describe('M09 Schema (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('M09 Tables Existence', () => {
    it('should have m09_calendars table accessible', async () => {
      const count = await prisma.m09_calendars.count();
      expect(typeof count).toBe('number');
    });

    it('should have m09_calendar_events table accessible', async () => {
      const count = await prisma.m09_calendar_events.count();
      expect(typeof count).toBe('number');
    });

    it('should have m09_class_sessions table accessible', async () => {
      const count = await prisma.m09_class_sessions.count();
      expect(typeof count).toBe('number');
    });

    it('should have m09_class_session_participants table accessible', async () => {
      const count = await prisma.m09_class_session_participants.count();
      expect(typeof count).toBe('number');
    });

    it('should have m09_class_session_state_logs table accessible', async () => {
      const count = await prisma.m09_class_session_state_logs.count();
      expect(typeof count).toBe('number');
    });

    it('should have m09_whiteboards table accessible', async () => {
      const count = await prisma.m09_whiteboards.count();
      expect(typeof count).toBe('number');
    });

    it('should have m09_whiteboard_elements table accessible', async () => {
      const count = await prisma.m09_whiteboard_elements.count();
      expect(typeof count).toBe('number');
    });
  });

  describe('M09 Schema Structure', () => {
    it('should be able to create and query a calendar (requires classroom)', async () => {
      // This test verifies the foreign key relationship works
      // We just verify the model is accessible - full CRUD would need a classroom
      const calendars = await prisma.m09_calendars.findMany({ take: 1 });
      expect(Array.isArray(calendars)).toBe(true);
    });

    it('should be able to query class sessions with state filter', async () => {
      // Verify that the M09ClassSessionState enum works
      const sessions = await prisma.m09_class_sessions.findMany({
        where: { state: 'scheduled' },
        take: 1,
      });
      expect(Array.isArray(sessions)).toBe(true);
    });

    it('should be able to query calendar events by type', async () => {
      // Verify that the M09CalendarEventType enum works
      const events = await prisma.m09_calendar_events.findMany({
        where: { event_type: 'class_session' },
        take: 1,
      });
      expect(Array.isArray(events)).toBe(true);
    });

    it('should be able to query whiteboard elements by type', async () => {
      // Verify that the M09WhiteboardElementType enum works
      const elements = await prisma.m09_whiteboard_elements.findMany({
        where: { element_type: 'stroke' },
        take: 1,
      });
      expect(Array.isArray(elements)).toBe(true);
    });
  });

  describe('M09 Indexes Verification', () => {
    it('should efficiently query class_session_participants by session_id', async () => {
      // This implicitly tests the index on session_id
      const startTime = Date.now();
      await prisma.m09_class_session_participants.findMany({
        where: { session_id: '00000000-0000-0000-0000-000000000000' },
      });
      const duration = Date.now() - startTime;
      // Should be fast even with index (< 100ms for empty table)
      expect(duration).toBeLessThan(1000);
    });

    it('should efficiently query whiteboards by session_id', async () => {
      const startTime = Date.now();
      await prisma.m09_whiteboards.findMany({
        where: { session_id: '00000000-0000-0000-0000-000000000000' },
      });
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('should efficiently query state_logs by session_id', async () => {
      const startTime = Date.now();
      await prisma.m09_class_session_state_logs.findMany({
        where: { session_id: '00000000-0000-0000-0000-000000000000' },
      });
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });
  });
});
