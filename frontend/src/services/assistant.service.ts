import { api } from './api.service';
import type {
  AssistantQueryRequest,
  AssistantQueryResponse,
} from '@/types';

/**
 * Assistant service
 * Maps to backend /assistant endpoints
 */
export const assistant_service = {
  /**
   * POST /assistant/query
   * Send a query to the assistant and get context-aware response
   */
  query: (data: AssistantQueryRequest): Promise<AssistantQueryResponse> =>
    api.post<AssistantQueryResponse>('/assistant/query', data),
};
