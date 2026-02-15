/**
 * Assistant types matching backend M01 DTOs
 * Based on contracts from backend/src/m01/dto/assistant-query.dto.ts
 */

// ============================================
// Assistant query types
// ============================================

export interface AssistantQueryRequest {
  query: string;
  route?: string;
  module?: string;
  classroom_id?: string;
  subject_id?: string;
  context?: Record<string, unknown>;
}

export interface AssistantQueryResponse {
  response: string;
  route?: string;
  module?: string;
  suggestions?: string[];
  metadata?: {
    processed_at: string;
    context_used: boolean;
  };
}

// ============================================
// Chat UI types
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}
