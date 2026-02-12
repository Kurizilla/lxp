import { Injectable, Logger } from '@nestjs/common';
import { AssistantQueryDto, AssistantResponseDto } from './dto';

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  /**
   * Process an assistant query and return contextual help
   * This is a stub implementation that returns predefined responses
   * In production, this would call an actual LLM API
   */
  async query(
    userId: bigint,
    queryDto: AssistantQueryDto,
  ): Promise<AssistantResponseDto> {
    const { query, institutionId, classroomId } = queryDto;

    this.logger.log(
      `Processing assistant query for user ${userId}: "${query.substring(0, 50)}..."`,
    );

    // Stub LLM response based on query patterns
    const response = this.generateStubResponse(query, institutionId, classroomId);

    return {
      response,
      context: {
        institutionId,
        classroomId,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        model: 'stub-llm-v1',
        isStub: true,
      },
    };
  }

  /**
   * Generate a stub response based on query content
   * In production, this would be replaced with actual LLM integration
   */
  private generateStubResponse(
    query: string,
    institutionId?: number,
    classroomId?: number,
  ): string {
    const queryLower = query.toLowerCase();

    // Context-aware responses
    let contextInfo = '';
    if (institutionId && classroomId) {
      contextInfo = `Para el aula ${classroomId} del establecimiento ${institutionId}: `;
    } else if (institutionId) {
      contextInfo = `Para el establecimiento ${institutionId}: `;
    }

    // Pattern matching for common queries
    if (queryLower.includes('asistencia') || queryLower.includes('attendance')) {
      return `${contextInfo}Para registrar asistencia, dirígete a la sección "Asistencia" en el menú principal. Allí podrás marcar la asistencia diaria de los estudiantes y ver el historial de asistencia.`;
    }

    if (queryLower.includes('calificacion') || queryLower.includes('nota') || queryLower.includes('grade')) {
      return `${contextInfo}Las calificaciones se pueden ingresar desde la sección "Evaluaciones". Selecciona la asignatura y el tipo de evaluación para registrar las notas de los estudiantes.`;
    }

    if (queryLower.includes('estudiante') || queryLower.includes('alumno') || queryLower.includes('student')) {
      return `${contextInfo}Puedes ver la lista de estudiantes en la sección "Estudiantes". Desde ahí puedes acceder al perfil individual de cada estudiante con su información académica y personal.`;
    }

    if (queryLower.includes('horario') || queryLower.includes('schedule')) {
      return `${contextInfo}El horario de clases está disponible en la sección "Horarios". Puedes ver el horario semanal y cualquier cambio programado.`;
    }

    if (queryLower.includes('comunicado') || queryLower.includes('mensaje') || queryLower.includes('message')) {
      return `${contextInfo}Para enviar comunicados, utiliza la sección "Comunicaciones". Puedes enviar mensajes a apoderados individuales o a toda la comunidad escolar.`;
    }

    if (queryLower.includes('ayuda') || queryLower.includes('help')) {
      return `${contextInfo}Estoy aquí para ayudarte. Puedo asistirte con consultas sobre asistencia, calificaciones, estudiantes, horarios y comunicaciones. ¿En qué puedo ayudarte hoy?`;
    }

    // Default response
    return `${contextInfo}Gracias por tu consulta. Este es un asistente en desarrollo. En el futuro, podré ayudarte con información más específica sobre tu consulta: "${query}". Por ahora, te recomiendo explorar las secciones del menú principal o contactar al administrador del sistema.`;
  }
}
