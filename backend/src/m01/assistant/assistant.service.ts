import { Injectable, Logger } from '@nestjs/common';
import {
  M01AssistantQueryDto,
  M01AssistantQueryResponseDto,
} from '../dto/assistant-query.dto';

/**
 * Service for handling assistant queries
 * Provides context-aware stub responses based on route/module
 */
@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  /**
   * Process an assistant query and return context-aware stub response
   */
  async processQuery(
    dto: M01AssistantQueryDto,
    userEmail: string,
  ): Promise<M01AssistantQueryResponseDto> {
    this.logger.log(
      `Processing assistant query from ${userEmail}: route=${dto.route || 'none'}, module=${dto.module || 'none'}`,
    );

    const response = this.generateStubResponse(dto);
    const suggestions = this.generateSuggestions(dto);

    return {
      response,
      route: dto.route,
      module: dto.module,
      suggestions,
      metadata: {
        processed_at: new Date(),
        context_used: !!(dto.route || dto.module || dto.context),
      },
    };
  }

  /**
   * Generate stub response based on route and module context
   */
  private generateStubResponse(dto: M01AssistantQueryDto): string {
    const { query, route, module } = dto;

    // Route-based responses
    if (route) {
      const routeLower = route.toLowerCase();

      if (routeLower.includes('classroom') || routeLower.includes('aula')) {
        return `[Stub] Información sobre aulas: "${query}". En esta sección puede gestionar sus aulas, ver estudiantes matriculados y revisar el progreso del curso.`;
      }

      if (routeLower.includes('subject') || routeLower.includes('materia')) {
        return `[Stub] Información sobre materias: "${query}". Las materias pueden asignarse a múltiples aulas y contienen el contenido del curso.`;
      }

      if (routeLower.includes('student') || routeLower.includes('estudiante')) {
        return `[Stub] Información sobre estudiantes: "${query}". Puede ver el progreso, calificaciones y participación de los estudiantes.`;
      }

      if (routeLower.includes('admin')) {
        return `[Stub] Panel de administración: "${query}". Desde aquí puede gestionar usuarios, roles, instituciones y configuración del sistema.`;
      }

      if (routeLower.includes('notification') || routeLower.includes('notificacion')) {
        return `[Stub] Gestión de notificaciones: "${query}". Configure alertas, anuncios y recordatorios para su institución.`;
      }
    }

    // Module-based responses
    if (module) {
      const moduleLower = module.toLowerCase();

      if (moduleLower === 'm01' || moduleLower.includes('auth')) {
        return `[Stub] Módulo de autenticación y organización: "${query}". Este módulo gestiona usuarios, roles, permisos e instituciones.`;
      }

      if (moduleLower.includes('content') || moduleLower.includes('contenido')) {
        return `[Stub] Módulo de contenido: "${query}". Gestione recursos educativos, materiales del curso y actividades.`;
      }

      if (moduleLower.includes('assessment') || moduleLower.includes('evaluacion')) {
        return `[Stub] Módulo de evaluación: "${query}". Cree exámenes, asignaciones y rúbricas de calificación.`;
      }

      if (moduleLower.includes('analytics') || moduleLower.includes('analitica')) {
        return `[Stub] Módulo de analíticas: "${query}". Revise métricas de rendimiento, reportes y tendencias.`;
      }
    }

    // Default response
    return `[Stub] Respuesta del asistente: "${query}". El asistente de IA está disponible para ayudarle con consultas sobre la plataforma LXP.`;
  }

  /**
   * Generate contextual suggestions based on route/module
   */
  private generateSuggestions(dto: M01AssistantQueryDto): string[] {
    const { route, module } = dto;
    const suggestions: string[] = [];

    if (route?.toLowerCase().includes('classroom')) {
      suggestions.push(
        '¿Cómo agregar estudiantes a un aula?',
        '¿Cómo ver el progreso del curso?',
        '¿Cómo configurar horarios?',
      );
    } else if (route?.toLowerCase().includes('admin')) {
      suggestions.push(
        '¿Cómo crear un nuevo usuario?',
        '¿Cómo asignar roles?',
        '¿Cómo configurar permisos?',
      );
    } else if (module?.toLowerCase().includes('content')) {
      suggestions.push(
        '¿Cómo subir materiales?',
        '¿Cómo organizar recursos?',
        '¿Cómo crear actividades?',
      );
    } else {
      suggestions.push(
        '¿Qué puedo hacer en esta sección?',
        '¿Cómo inicio?',
        '¿Dónde encuentro ayuda?',
      );
    }

    return suggestions;
  }
}
