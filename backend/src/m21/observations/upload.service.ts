import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { CryptoService } from '../../common/crypto';

/**
 * Presigned URL response for S3 upload
 */
export interface M21PresignedUrlResponse {
  upload_url: string;
  file_key: string;
  expires_in_seconds: number;
  s3_bucket: string;
  s3_region: string;
}

/**
 * DTO for requesting a presigned URL
 */
export interface M21PresignedUrlRequestDto {
  storage_bucket_id: string;
  class_id: string;
  filename: string;
  mime_type: string;
  file_size_bytes?: number;
}

/**
 * Upload completion data
 */
export interface M21UploadCompletionData {
  file_key: string;
  mime_type: string;
  file_size_bytes: number;
  duration_seconds?: number;
}

/**
 * Service for handling S3 file upload operations
 * Handles presigned URL generation and upload completion
 * 
 * NOTE: This is a stub implementation. In production, this would
 * integrate with AWS S3 SDK to generate actual presigned URLs.
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly DEFAULT_PRESIGNED_URL_EXPIRY = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  /**
   * Generate a presigned URL for uploading a file to S3
   * 
   * @param dto - Request containing bucket ID, class ID, filename
   * @returns Presigned URL response with upload details
   * 
   * STUB: Returns a mock presigned URL. In production, this would:
   * 1. Decrypt bucket credentials
   * 2. Use AWS S3 SDK to generate a presigned PUT URL
   * 3. Return the URL with proper expiration
   */
  async generatePresignedUrl(dto: M21PresignedUrlRequestDto): Promise<M21PresignedUrlResponse> {
    // Validate storage bucket exists and is active
    const bucket = await this.prisma.m21_storage_buckets.findUnique({
      where: { id: dto.storage_bucket_id },
    });

    if (!bucket || !bucket.is_active) {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid or inactive storage bucket',
      });
    }

    // Validate classroom exists
    const classroom = await this.prisma.m01_classrooms.findUnique({
      where: { id: dto.class_id },
    });

    if (!classroom) {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid classroom ID',
      });
    }

    // Generate a unique file key based on class_id and timestamp
    const timestamp = Date.now();
    const sanitizedFilename = this.sanitizeFilename(dto.filename);
    const fileKey = `recordings/${dto.class_id}/${timestamp}-${sanitizedFilename}`;

    // STUB: Generate mock presigned URL
    // In production, this would use AWS S3 SDK:
    // const s3 = new S3Client({ region: bucket.s3_region, credentials: {...} });
    // const command = new PutObjectCommand({ Bucket: bucket.s3_bucket, Key: fileKey });
    // const presignedUrl = await getSignedUrl(s3, command, { expiresIn: this.DEFAULT_PRESIGNED_URL_EXPIRY });
    
    const presignedUrl = this.generateStubPresignedUrl(bucket.s3_bucket, bucket.s3_region, fileKey);

    this.logger.log(`Generated presigned URL for file: ${fileKey}`);

    return {
      upload_url: presignedUrl,
      file_key: fileKey,
      expires_in_seconds: this.DEFAULT_PRESIGNED_URL_EXPIRY,
      s3_bucket: bucket.s3_bucket,
      s3_region: bucket.s3_region,
    };
  }

  /**
   * Get bucket credentials for internal S3 operations
   * Decrypts stored credentials
   * 
   * @param bucketId - The storage bucket ID
   * @returns Decrypted credentials or null if bucket not found
   */
  async getBucketCredentials(
    bucketId: string,
  ): Promise<{ access_key: string; secret_key: string; s3_bucket: string; s3_region: string } | null> {
    const bucket = await this.prisma.m21_storage_buckets.findUnique({
      where: { id: bucketId, is_active: true },
    });

    if (!bucket) {
      return null;
    }

    try {
      return {
        access_key: this.cryptoService.decrypt(bucket.access_key_encrypted),
        secret_key: this.cryptoService.decrypt(bucket.secret_key_encrypted),
        s3_bucket: bucket.s3_bucket,
        s3_region: bucket.s3_region,
      };
    } catch (error) {
      this.logger.error(`Failed to decrypt credentials for bucket ${bucketId}`);
      return null;
    }
  }

  /**
   * Validate that a recording exists and is in the correct status for upload completion
   * 
   * @param recordingId - The recording ID
   * @returns The recording if valid
   * @throws NotFoundException if recording not found
   * @throws BadRequestException if not in uploading status
   */
  async validateRecordingForCompletion(recordingId: string) {
    const recording = await this.prisma.m21_observation_recordings.findUnique({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Recording with ID ${recordingId} not found`,
      });
    }

    if (recording.status !== 'uploading') {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Recording is not in uploading status',
      });
    }

    return recording;
  }

  /**
   * Update recording with upload completion data
   * 
   * @param recordingId - The recording ID
   * @param data - Upload completion data
   * @returns Updated recording
   */
  async completeUpload(recordingId: string, data: M21UploadCompletionData) {
    // First validate the recording
    await this.validateRecordingForCompletion(recordingId);

    // Update the recording with file metadata and set status to processing
    const recording = await this.prisma.m21_observation_recordings.update({
      where: { id: recordingId },
      data: {
        file_key: data.file_key,
        mime_type: data.mime_type,
        file_size_bytes: BigInt(data.file_size_bytes),
        duration_seconds: data.duration_seconds,
        status: 'processing',
      },
    });

    this.logger.log(`Completed upload for recording ${recordingId}`);

    return recording;
  }

  /**
   * Update recording status
   * 
   * @param recordingId - The recording ID
   * @param status - New status
   * @returns Updated recording
   */
  async updateRecordingStatus(
    recordingId: string,
    status: 'uploading' | 'processing' | 'ready' | 'transcribing' | 'analyzing' | 'completed' | 'failed' | 'archived',
  ) {
    const recording = await this.prisma.m21_observation_recordings.findUnique({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Recording with ID ${recordingId} not found`,
      });
    }

    const updated = await this.prisma.m21_observation_recordings.update({
      where: { id: recordingId },
      data: { status },
    });

    this.logger.log(`Updated recording ${recordingId} status to ${status}`);

    return updated;
  }

  /**
   * Generate a stub presigned URL for development/testing
   * 
   * @param bucket - S3 bucket name
   * @param region - S3 region
   * @param fileKey - File key/path
   * @returns Stub presigned URL
   */
  private generateStubPresignedUrl(bucket: string, region: string, fileKey: string): string {
    // Generate a stub URL that looks like a real presigned URL
    const stubSignature = Buffer.from(`stub-signature-${Date.now()}`).toString('base64').slice(0, 40);
    
    return `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}?` +
      `X-Amz-Algorithm=AWS4-HMAC-SHA256&` +
      `X-Amz-Credential=STUB_ACCESS_KEY%2F${new Date().toISOString().slice(0, 10).replace(/-/g, '')}%2F${region}%2Fs3%2Faws4_request&` +
      `X-Amz-Date=${new Date().toISOString().replace(/[:-]/g, '').slice(0, 15)}Z&` +
      `X-Amz-Expires=${this.DEFAULT_PRESIGNED_URL_EXPIRY}&` +
      `X-Amz-SignedHeaders=host&` +
      `X-Amz-Signature=${stubSignature}`;
  }

  /**
   * Sanitize filename for use in S3 key
   * 
   * @param filename - Original filename
   * @returns Sanitized filename
   */
  private sanitizeFilename(filename: string): string {
    // Remove dangerous characters, keep alphanumeric, dash, underscore, and dot
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 100); // Limit length
  }
}
