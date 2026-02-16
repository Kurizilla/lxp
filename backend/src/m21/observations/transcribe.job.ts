import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../common/prisma';
import { M21_PROCESSING_QUEUE } from '../m21.module';
import { M21_TRANSCRIBE_JOB } from './transcription.service';
import {
  M21TranscribeJobData,
  M21TranscribeJobResult,
  M21TranscriptSegmentDto,
} from '../dto/transcription.dto';

/**
 * Stub transcription segments for demo/testing purposes
 * Simulates what an AI transcription service would return
 */
const STUB_TRANSCRIPT_SEGMENTS: M21TranscriptSegmentDto[] = [
  {
    start_seconds: 0,
    end_seconds: 5,
    text: 'Buenos días clase, hoy vamos a hablar sobre un tema muy importante.',
    speaker: 'Teacher',
    confidence: 0.95,
  },
  {
    start_seconds: 5,
    end_seconds: 12,
    text: 'Por favor abran sus libros en la página 45.',
    speaker: 'Teacher',
    confidence: 0.92,
  },
  {
    start_seconds: 12,
    end_seconds: 18,
    text: 'Profesora, no encuentro mi libro.',
    speaker: 'Student 1',
    confidence: 0.88,
  },
  {
    start_seconds: 18,
    end_seconds: 25,
    text: 'No te preocupes, puedes compartir con tu compañero de al lado.',
    speaker: 'Teacher',
    confidence: 0.94,
  },
  {
    start_seconds: 25,
    end_seconds: 35,
    text: 'Hoy vamos a revisar las fracciones y cómo sumarlas cuando tienen diferentes denominadores.',
    speaker: 'Teacher',
    confidence: 0.96,
  },
  {
    start_seconds: 35,
    end_seconds: 42,
    text: '¿Alguien puede decirme qué es un denominador común?',
    speaker: 'Teacher',
    confidence: 0.93,
  },
  {
    start_seconds: 42,
    end_seconds: 50,
    text: 'Es el número que está abajo de la fracción, ¿verdad?',
    speaker: 'Student 2',
    confidence: 0.87,
  },
  {
    start_seconds: 50,
    end_seconds: 60,
    text: 'Muy bien, el denominador está debajo de la línea. Ahora vamos a practicar con algunos ejemplos.',
    speaker: 'Teacher',
    confidence: 0.95,
  },
];

/**
 * Processor for M21 transcription jobs
 * 
 * This processor handles transcription jobs from the BullMQ queue.
 * Currently implements a stub that saves static transcript segments
 * to simulate AI transcription output.
 * 
 * In production, this would integrate with:
 * - OpenAI Whisper API
 * - AWS Transcribe
 * - Google Speech-to-Text
 * - or similar transcription services
 */
@Processor(M21_PROCESSING_QUEUE)
export class TranscribeJobProcessor {
  private readonly logger = new Logger(TranscribeJobProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process a transcription job
   * 
   * STUB IMPLEMENTATION: Creates a transcript with static demo segments
   * In production, this would:
   * 1. Fetch the audio/video file from S3
   * 2. Send to AI transcription service
   * 3. Parse and structure the response
   * 4. Save to database
   * 
   * @param job - The Bull job containing transcription data
   * @returns The result of the transcription job
   */
  @Process(M21_TRANSCRIBE_JOB)
  async handleTranscribe(job: Job<M21TranscribeJobData>): Promise<M21TranscribeJobResult> {
    const { recording_id, user_id, language } = job.data;

    this.logger.log(`Processing transcription job ${job.id} for recording ${recording_id}`);
    this.logger.log(`User: ${user_id}, Language hint: ${language || 'auto-detect'}`);

    try {
      // Verify recording exists
      const recording = await this.prisma.m21_observation_recordings.findUnique({
        where: { id: recording_id },
      });

      if (!recording) {
        this.logger.error(`Recording ${recording_id} not found`);
        return {
          success: false,
          recording_id,
          error: 'Recording not found',
        };
      }

      // STUB: Simulate processing time (1-2 seconds)
      await this.simulateProcessingDelay();

      // Generate full text from segments
      const fullText = STUB_TRANSCRIPT_SEGMENTS.map((s) => s.text).join(' ');

      // Create the transcript record
      const transcript = await this.prisma.m21_transcripts.create({
        data: {
          observation_recording_id: recording_id,
          full_text: fullText,
          segments: STUB_TRANSCRIPT_SEGMENTS as unknown as object,
        },
      });

      // Update recording status to completed (or analyzing if that's the next step)
      await this.prisma.m21_observation_recordings.update({
        where: { id: recording_id },
        data: { status: 'completed' },
      });

      this.logger.log(`Transcription completed for recording ${recording_id}, transcript ID: ${transcript.id}`);

      return {
        success: true,
        recording_id,
        transcript_id: transcript.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Transcription failed for recording ${recording_id}: ${errorMessage}`);

      // Update recording status to failed
      try {
        await this.prisma.m21_observation_recordings.update({
          where: { id: recording_id },
          data: { status: 'failed' },
        });
      } catch (updateError) {
        this.logger.error(`Failed to update recording status: ${updateError}`);
      }

      return {
        success: false,
        recording_id,
        error: errorMessage,
      };
    }
  }

  /**
   * Simulate processing delay for stub implementation
   * In production, this would be the actual transcription time
   */
  private async simulateProcessingDelay(): Promise<void> {
    const delayMs = Math.floor(Math.random() * 1000) + 1000; // 1-2 seconds
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
