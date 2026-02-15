import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { M09CalendarService } from './calendar.service';
import { PrismaService } from '../../common/prisma';
import { AuthenticatedUser } from '../../m01/auth/jwt.strategy';

describe('M09CalendarService', () => {
  let service: M09CalendarService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'teacher@example.com',
    first_name: 'Test',
    last_name: 'Teacher',
    session_id: 'session-123',
  };

  const mockClassroom = {
    id: 'classroom-123',
    institution_id: 'inst-123',
    subject_id: 'subj-123',
    name: 'Math 101',
    section: 'A',
    academic_year: '2025-2026',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockCalendar = {
    id: 'calendar-123',
    classroom_id: 'classroom-123',
    name: 'Math 101 Calendar',
    description: 'Calendar for Math class',
    timezone: 'UTC',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockEvent = {
    id: 'event-123',
    calendar_id: 'calendar-123',
    title: 'Test Event',
    description: 'A test event',
    event_type: 'class_session',
    start_time: new Date('2026-02-15T10:00:00Z'),
    end_time: new Date('2026-02-15T11:00:00Z'),
    all_day: false,
    recurrence_pattern: 'none',
    recurrence_end: null,
    location: 'Room 101',
    color: '#3498db',
    created_by: 'user-123',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      m01_classrooms: {
        findUnique: jest.fn(),
      },
      m09_calendars: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      m09_calendar_events: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        M09CalendarService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<M09CalendarService>(M09CalendarService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assignCalendar', () => {
    it('should assign a calendar to a classroom successfully', async () => {
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(mockClassroom);
      (prismaService.m09_calendars.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.m09_calendars.create as jest.Mock).mockResolvedValue(mockCalendar);

      const result = await service.assignCalendar(
        {
          classroom_id: 'classroom-123',
          name: 'Math 101 Calendar',
          description: 'Calendar for Math class',
        },
        mockUser,
      );

      expect(result.calendar).toBeDefined();
      expect(result.calendar.id).toBe(mockCalendar.id);
      expect(result.calendar.classroom_id).toBe(mockCalendar.classroom_id);
      expect(result.message).toBe('Calendar assigned successfully');

      expect(prismaService.m01_classrooms.findUnique).toHaveBeenCalledWith({
        where: { id: 'classroom-123' },
      });
      expect(prismaService.m09_calendars.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when classroom not found', async () => {
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.assignCalendar(
          {
            classroom_id: 'nonexistent-classroom',
            name: 'Calendar',
          },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when calendar already exists', async () => {
      (prismaService.m01_classrooms.findUnique as jest.Mock).mockResolvedValue(mockClassroom);
      (prismaService.m09_calendars.findUnique as jest.Mock).mockResolvedValue(mockCalendar);

      await expect(
        service.assignCalendar(
          {
            classroom_id: 'classroom-123',
            name: 'Calendar',
          },
          mockUser,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getCalendarById', () => {
    it('should return calendar when found', async () => {
      (prismaService.m09_calendars.findUnique as jest.Mock).mockResolvedValue(mockCalendar);

      const result = await service.getCalendarById('calendar-123');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockCalendar.id);
      expect(result.name).toBe(mockCalendar.name);
    });

    it('should throw NotFoundException when calendar not found', async () => {
      (prismaService.m09_calendars.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getCalendarById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCalendarByClassroom', () => {
    it('should return calendar by classroom ID', async () => {
      (prismaService.m09_calendars.findUnique as jest.Mock).mockResolvedValue(mockCalendar);

      const result = await service.getCalendarByClassroom('classroom-123');

      expect(result).toBeDefined();
      expect(result.classroom_id).toBe('classroom-123');
    });

    it('should throw NotFoundException when calendar not found for classroom', async () => {
      (prismaService.m09_calendars.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getCalendarByClassroom('nonexistent-classroom'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCalendar', () => {
    it('should update calendar successfully', async () => {
      const updatedCalendar = { ...mockCalendar, name: 'Updated Name' };
      (prismaService.m09_calendars.findUnique as jest.Mock).mockResolvedValue(mockCalendar);
      (prismaService.m09_calendars.update as jest.Mock).mockResolvedValue(updatedCalendar);

      const result = await service.updateCalendar(
        'calendar-123',
        { name: 'Updated Name' },
        mockUser,
      );

      expect(result.calendar.name).toBe('Updated Name');
      expect(result.message).toBe('Calendar updated successfully');
    });

    it('should throw NotFoundException when calendar not found', async () => {
      (prismaService.m09_calendars.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateCalendar('nonexistent', { name: 'Test' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createEvent', () => {
    it('should create calendar event successfully', async () => {
      (prismaService.m09_calendars.findUnique as jest.Mock).mockResolvedValue(mockCalendar);
      (prismaService.m09_calendar_events.create as jest.Mock).mockResolvedValue(mockEvent);

      const result = await service.createEvent(
        {
          calendar_id: 'calendar-123',
          title: 'Test Event',
          start_time: '2026-02-15T10:00:00Z',
          end_time: '2026-02-15T11:00:00Z',
        },
        mockUser,
      );

      expect(result.event).toBeDefined();
      expect(result.event.id).toBe(mockEvent.id);
      expect(result.event.title).toBe(mockEvent.title);
      expect(result.message).toBe('Event created successfully');
    });

    it('should throw NotFoundException when calendar not found', async () => {
      (prismaService.m09_calendars.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createEvent(
          {
            calendar_id: 'nonexistent',
            title: 'Test',
            start_time: '2026-02-15T10:00:00Z',
            end_time: '2026-02-15T11:00:00Z',
          },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when end time is before start time', async () => {
      (prismaService.m09_calendars.findUnique as jest.Mock).mockResolvedValue(mockCalendar);

      await expect(
        service.createEvent(
          {
            calendar_id: 'calendar-123',
            title: 'Test',
            start_time: '2026-02-15T11:00:00Z',
            end_time: '2026-02-15T10:00:00Z',
          },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listEvents', () => {
    it('should list events with pagination', async () => {
      (prismaService.m09_calendar_events.count as jest.Mock).mockResolvedValue(1);
      (prismaService.m09_calendar_events.findMany as jest.Mock).mockResolvedValue([mockEvent]);

      const result = await service.listEvents({
        calendar_id: 'calendar-123',
        limit: 10,
        offset: 0,
      });

      expect(result.events).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('should filter events by date range', async () => {
      (prismaService.m09_calendar_events.count as jest.Mock).mockResolvedValue(1);
      (prismaService.m09_calendar_events.findMany as jest.Mock).mockResolvedValue([mockEvent]);

      await service.listEvents({
        calendar_id: 'calendar-123',
        start_date: '2026-02-01',
        end_date: '2026-02-28',
      });

      expect(prismaService.m09_calendar_events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            start_time: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        }),
      );
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      const updatedEvent = { ...mockEvent, title: 'Updated Event' };
      (prismaService.m09_calendar_events.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prismaService.m09_calendar_events.update as jest.Mock).mockResolvedValue(updatedEvent);

      const result = await service.updateEvent(
        'event-123',
        { title: 'Updated Event' },
        mockUser,
      );

      expect(result.event.title).toBe('Updated Event');
      expect(result.message).toBe('Event updated successfully');
    });

    it('should throw NotFoundException when event not found', async () => {
      (prismaService.m09_calendar_events.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateEvent('nonexistent', { title: 'Test' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      (prismaService.m09_calendar_events.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prismaService.m09_calendar_events.delete as jest.Mock).mockResolvedValue(mockEvent);

      const result = await service.deleteEvent('event-123', mockUser);

      expect(result.deleted).toBe(true);
      expect(result.message).toBe('Event deleted successfully');
    });

    it('should throw NotFoundException when event not found', async () => {
      (prismaService.m09_calendar_events.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteEvent('nonexistent', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
