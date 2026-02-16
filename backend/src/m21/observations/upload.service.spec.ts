import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';
import { PrismaService } from '../../common/prisma';
import { CryptoService } from '../../common/crypto';

describe('UploadService', () => {
  let service: UploadService;

  const mockBucket = {
    id: 'bucket-123',
    name: 'test-bucket',
    s3_bucket: 'test-s3-bucket',
    s3_region: 'us-east-1',
    access_key_encrypted: 'encrypted_access_key',
    secret_key_encrypted: 'encrypted_secret_key',
    is_active: true,
    created_by_id: 'user-123',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockClassroom = {
    id: 'class-123',
    institution_id: 'inst-123',
    subject_id: 'subject-123',
    name: 'Test Classroom',
  };

  const mockRecording = {
    id: 'recording-123',
    storage_bucket_id: 'bucket-123',
    class_id: 'class-123',
    teacher_id: 'teacher-123',
    observer_id: 'observer-123',
    session_date: new Date(),
    file_key: 'recordings/class-123/test.mp4',
    mime_type: 'video/mp4',
    duration_seconds: 3600,
    file_size_bytes: BigInt(1000000),
    status: 'uploading',
    metadata: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPrismaService = {
    m21_storage_buckets: {
      findUnique: jest.fn(),
    },
    m01_classrooms: {
      findUnique: jest.fn(),
    },
    m21_observation_recordings: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCryptoService = {
    encrypt: jest.fn((value: string) => `encrypted_${value}`),
    decrypt: jest.fn((value: string) => value.replace('encrypted_', '')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================================
  // GENERATE PRESIGNED URL
  // ============================================================================

  describe('generatePresignedUrl', () => {
    it('should generate a presigned URL for valid bucket and class', async () => {
      mockPrismaService.m21_storage_buckets.findUnique.mockResolvedValue(mockBucket);
      mockPrismaService.m01_classrooms.findUnique.mockResolvedValue(mockClassroom);

      const dto = {
        storage_bucket_id: 'bucket-123',
        class_id: 'class-123',
        filename: 'test-video.mp4',
        mime_type: 'video/mp4',
      };

      const result = await service.generatePresignedUrl(dto);

      expect(result.upload_url).toBeDefined();
      expect(result.upload_url).toContain('test-s3-bucket');
      expect(result.upload_url).toContain('us-east-1');
      expect(result.file_key).toContain('recordings/class-123/');
      expect(result.file_key).toContain('test-video.mp4');
      expect(result.expires_in_seconds).toBe(3600);
      expect(result.s3_bucket).toBe('test-s3-bucket');
      expect(result.s3_region).toBe('us-east-1');
    });

    it('should throw BadRequestException for invalid storage bucket', async () => {
      mockPrismaService.m21_storage_buckets.findUnique.mockResolvedValue(null);

      const dto = {
        storage_bucket_id: 'invalid-bucket',
        class_id: 'class-123',
        filename: 'test-video.mp4',
        mime_type: 'video/mp4',
      };

      await expect(service.generatePresignedUrl(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for inactive storage bucket', async () => {
      mockPrismaService.m21_storage_buckets.findUnique.mockResolvedValue({
        ...mockBucket,
        is_active: false,
      });

      const dto = {
        storage_bucket_id: 'bucket-123',
        class_id: 'class-123',
        filename: 'test-video.mp4',
        mime_type: 'video/mp4',
      };

      await expect(service.generatePresignedUrl(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid classroom', async () => {
      mockPrismaService.m21_storage_buckets.findUnique.mockResolvedValue(mockBucket);
      mockPrismaService.m01_classrooms.findUnique.mockResolvedValue(null);

      const dto = {
        storage_bucket_id: 'bucket-123',
        class_id: 'invalid-class',
        filename: 'test-video.mp4',
        mime_type: 'video/mp4',
      };

      await expect(service.generatePresignedUrl(dto)).rejects.toThrow(BadRequestException);
    });

    it('should sanitize filename with special characters', async () => {
      mockPrismaService.m21_storage_buckets.findUnique.mockResolvedValue(mockBucket);
      mockPrismaService.m01_classrooms.findUnique.mockResolvedValue(mockClassroom);

      const dto = {
        storage_bucket_id: 'bucket-123',
        class_id: 'class-123',
        filename: 'test video (1).mp4',
        mime_type: 'video/mp4',
      };

      const result = await service.generatePresignedUrl(dto);

      // Should replace special chars with underscores (multiple underscores collapsed)
      expect(result.file_key).toContain('test_video_1_.mp4');
    });
  });

  // ============================================================================
  // GET BUCKET CREDENTIALS
  // ============================================================================

  describe('getBucketCredentials', () => {
    it('should return decrypted credentials for active bucket', async () => {
      mockPrismaService.m21_storage_buckets.findUnique.mockResolvedValue(mockBucket);

      const result = await service.getBucketCredentials('bucket-123');

      expect(result).toEqual({
        access_key: 'access_key',
        secret_key: 'secret_key',
        s3_bucket: 'test-s3-bucket',
        s3_region: 'us-east-1',
      });
      expect(mockCryptoService.decrypt).toHaveBeenCalledTimes(2);
    });

    it('should return null for non-existent bucket', async () => {
      mockPrismaService.m21_storage_buckets.findUnique.mockResolvedValue(null);

      const result = await service.getBucketCredentials('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null if decryption fails', async () => {
      mockPrismaService.m21_storage_buckets.findUnique.mockResolvedValue(mockBucket);
      mockCryptoService.decrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const result = await service.getBucketCredentials('bucket-123');

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // VALIDATE RECORDING FOR COMPLETION
  // ============================================================================

  describe('validateRecordingForCompletion', () => {
    it('should return recording if in uploading status', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);

      const result = await service.validateRecordingForCompletion('recording-123');

      expect(result.id).toBe('recording-123');
      expect(result.status).toBe('uploading');
    });

    it('should throw NotFoundException if recording not found', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(null);

      await expect(
        service.validateRecordingForCompletion('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if not in uploading status', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue({
        ...mockRecording,
        status: 'ready',
      });

      await expect(
        service.validateRecordingForCompletion('recording-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================================
  // COMPLETE UPLOAD
  // ============================================================================

  describe('completeUpload', () => {
    it('should update recording with file metadata', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        file_key: 'recordings/class-123/new-file.mp4',
        mime_type: 'video/mp4',
        file_size_bytes: BigInt(2000000),
        duration_seconds: 7200,
        status: 'processing',
      });

      const result = await service.completeUpload('recording-123', {
        file_key: 'recordings/class-123/new-file.mp4',
        mime_type: 'video/mp4',
        file_size_bytes: 2000000,
        duration_seconds: 7200,
      });

      expect(result.status).toBe('processing');
      expect(mockPrismaService.m21_observation_recordings.update).toHaveBeenCalledWith({
        where: { id: 'recording-123' },
        data: {
          file_key: 'recordings/class-123/new-file.mp4',
          mime_type: 'video/mp4',
          file_size_bytes: BigInt(2000000),
          duration_seconds: 7200,
          status: 'processing',
        },
      });
    });

    it('should throw NotFoundException if recording not found', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(null);

      await expect(
        service.completeUpload('nonexistent', {
          file_key: 'test.mp4',
          mime_type: 'video/mp4',
          file_size_bytes: 1000000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if not in uploading status', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue({
        ...mockRecording,
        status: 'processing',
      });

      await expect(
        service.completeUpload('recording-123', {
          file_key: 'test.mp4',
          mime_type: 'video/mp4',
          file_size_bytes: 1000000,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================================
  // UPDATE RECORDING STATUS
  // ============================================================================

  describe('updateRecordingStatus', () => {
    it('should update recording status', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(mockRecording);
      mockPrismaService.m21_observation_recordings.update.mockResolvedValue({
        ...mockRecording,
        status: 'completed',
      });

      const result = await service.updateRecordingStatus('recording-123', 'completed');

      expect(result.status).toBe('completed');
      expect(mockPrismaService.m21_observation_recordings.update).toHaveBeenCalledWith({
        where: { id: 'recording-123' },
        data: { status: 'completed' },
      });
    });

    it('should throw NotFoundException if recording not found', async () => {
      mockPrismaService.m21_observation_recordings.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRecordingStatus('nonexistent', 'completed'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
