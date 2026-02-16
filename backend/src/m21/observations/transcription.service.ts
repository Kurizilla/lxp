import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../common/prisma';
import { M21AbilityFactory, M21UserWithPermissions } from '../casl/m21-ability.factory';
import {
  M21RequestTranscriptionDto,
  M21TranscriptDto,
  M21TranscriptResponseDto,
  M21TranscriptionJobResponseDto,
  M21TranscriptionJobStatus,
  M21TranscribeJobData,
  M21TranscriptSegmentDto,
} from '../dto/transcription.dto';
import { M21_PROCESSING_QUEUE } from '../m21.module';

/**
 * Job name for transcription jobs in the queue
 */
export const M21_TRANSCRIBE_JOB = 'm21_transcribe';

/**
 * Service for managing transcription jobs and retrieving transcripts
 * 
 * Handles:
 * - Queueing transcription jobs via BullMQ
 * - Retrieving transcripts for observation recordings
 * - Checking transcription job status
 */
@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: M21AbilityFactory,
    @InjectQueue(M21_PROCESSING_QUEUE) private readonly processingQueue: Queue<M21TranscribeJobData>,
  ) {}

  /**
   * Queue a transcription job for a recording
   * 
   * @param recordingId - The ID of the recording to transcribe
   * @param dto - Optional transcription parameters
   * @param userWithPermissions - The authenticated user
   * @returns Job status response
   */
  async queueTranscription(
    recordingId: string,
    dto: M21RequestTranscriptionDto,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21TranscriptionJobResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'ObservationRecording')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to transcribe recordings',
      });
    }

    // Validate recording exists
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

    // Check if recording is in a valid state for transcription
    const validStatuses = ['ready', 'completed'];
    if (!validStatuses.includes(recording.status)) {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: `Recording must be in 'ready' or 'completed' status to transcribe. Current status: ${recording.status}`,
      });
    }

    // Check if transcription already exists
    const existingTranscript = await this.prisma.m21_transcripts.findUnique({
      where: { observation_recording_id: recordingId },
    });

    if (existingTranscript) {
      throw new BadRequestException({
        type: 'https://httpstatuses.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Transcript already exists for this recording',
      });
    }

    // Update recording status to transcribing
    await this.prisma.m21_observation_recordings.update({
      where: { id: recordingId },
      data: { status: 'transcribing' },
    });

    // Queue the transcription job
    const jobData: M21TranscribeJobData = {
      recording_id: recordingId,
      user_id: userWithPermissions.id,
      language: dto.language,
      priority: dto.priority,
    };

    const job = await this.processingQueue.add(M21_TRANSCRIBE_JOB, jobData, {
      priority: dto.priority || 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    this.logger.log(`Queued transcription job ${job.id} for recording ${recordingId}`);

    return {
      job_id: job.id?.toString() || 'unknown',
      recording_id: recordingId,
      status: M21TranscriptionJobStatus.pending,
      message: 'Transcription job queued successfully',
      created_at: new Date(),
    };
  }

  /**
   * Get the transcript for a recording
   * 
   * @param recordingId - The ID of the recording
   * @param userWithPermissions - The authenticated user
   * @returns The transcript response
   */
  async getTranscript(
    recordingId: string,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21TranscriptResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'Transcript')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to view transcripts',
      });
    }

    // Validate recording exists
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

    // Get the transcript
    const transcript = await this.prisma.m21_transcripts.findUnique({
      where: { observation_recording_id: recordingId },
    });

    if (!transcript) {
      throw new NotFoundException({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: `Transcript not found for recording ${recordingId}`,
      });
    }

    const transcriptDto: M21TranscriptDto = {
      id: transcript.id,
      observation_recording_id: transcript.observation_recording_id,
      full_text: transcript.full_text,
      segments: transcript.segments as M21TranscriptSegmentDto[] | null,
      created_at: transcript.created_at,
      updated_at: transcript.updated_at,
    };

    this.logger.log(`Retrieved transcript ${transcript.id} for recording ${recordingId}`);

    return {
      transcript: transcriptDto,
    };
  }

  /**
   * Get the status of a transcription job
   * 
   * @param recordingId - The ID of the recording
   * @param userWithPermissions - The authenticated user
   * @returns The job status
   */
  async getTranscriptionStatus(
    recordingId: string,
    userWithPermissions: M21UserWithPermissions,
  ): Promise<M21TranscriptionJobResponseDto> {
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    if (!ability.can('read', 'ObservationRecording')) {
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'You do not have permission to check transcription status',
      });
    }

    // Get recording to check status
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

    // Check if transcript exists
    const transcript = await this.prisma.m21_transcripts.findUnique({
      where: { observation_recording_id: recordingId },
    });

    let status: M21TranscriptionJobStatus;
    let message: string;

    if (transcript) {
      status = M21TranscriptionJobStatus.completed;
      message = 'Transcription completed';
    } else if (recording.status === 'transcribing') {
      status = M21TranscriptionJobStatus.processing;
      message = 'Transcription in progress';
    } else if (recording.status === 'failed') {
      status = M21TranscriptionJobStatus.failed;
      message = 'Transcription failed';
    } else {
      status = M21TranscriptionJobStatus.pending;
      message = 'Transcription not started';
    }

    return {
      job_id: 'status-check',
      recording_id: recordingId,
      status,
      message,
    };
  }
}
