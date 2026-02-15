import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Button,
  Card,
  Alert,
} from '@/components/ui';
import { assistant_service, ApiException } from '@/services';
import type { ChatMessage } from '@/types';

/**
 * Generate unique ID for messages
 */
function generate_id(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format timestamp for display
 */
function format_time(date_string: string): string {
  const date = new Date(date_string);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Assistant Page
 * Chat interface for interacting with the AI assistant
 */
export function AssistantPage() {
  const location = useLocation();

  // Chat state
  const [messages, set_messages] = useState<ChatMessage[]>([]);
  const [input_value, set_input_value] = useState('');

  // Loading state
  const [is_sending, set_is_sending] = useState(false);
  const [error, set_error] = useState<string | null>(null);

  // Refs
  const messages_end_ref = useRef<HTMLDivElement>(null);
  const input_ref = useRef<HTMLTextAreaElement>(null);

  /**
   * Scroll to bottom of messages
   */
  const scroll_to_bottom = useCallback(() => {
    messages_end_ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /**
   * Handle send message
   */
  const handle_send = async (query?: string) => {
    const message_text = query || input_value.trim();
    if (!message_text || is_sending) return;

    // Clear input
    set_input_value('');
    set_error(null);

    // Add user message
    const user_message: ChatMessage = {
      id: generate_id(),
      role: 'user',
      content: message_text,
      timestamp: new Date().toISOString(),
    };
    set_messages((prev) => [...prev, user_message]);

    // Start loading
    set_is_sending(true);

    try {
      const response = await assistant_service.query({
        query: message_text,
        route: location.pathname,
        module: 'teacher',
      });

      // Add assistant response
      const assistant_message: ChatMessage = {
        id: generate_id(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        suggestions: response.suggestions,
      };
      set_messages((prev) => [...prev, assistant_message]);
    } catch (err) {
      if (err instanceof ApiException) {
        set_error(err.message);
      } else {
        set_error('Failed to send message. Please try again.');
      }
    } finally {
      set_is_sending(false);
    }
  };

  /**
   * Handle key down in textarea
   */
  const handle_key_down = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handle_send();
    }
  };

  /**
   * Handle suggestion click
   */
  const handle_suggestion_click = (suggestion: string) => {
    set_input_value(suggestion);
    input_ref.current?.focus();
  };

  /**
   * Handle clear chat
   */
  const handle_clear = () => {
    set_messages([]);
    set_error(null);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scroll_to_bottom();
  }, [messages, scroll_to_bottom]);

  // Focus input on mount
  useEffect(() => {
    input_ref.current?.focus();
  }, []);

  // Add welcome message on mount
  useEffect(() => {
    const welcome_message: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your teaching assistant. I can help you with:\n\n- Creating lesson plans and activities\n- Finding educational resources\n- Managing classroom tasks\n- Answering questions about the platform\n\nHow can I help you today?',
      timestamp: new Date().toISOString(),
      suggestions: [
        'Help me create a lesson plan',
        'What activities can I use for my class?',
        'How do I manage assignments?',
      ],
    };
    set_messages([welcome_message]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Teaching Assistant</h1>
          <p className="text-sm text-gray-500">AI-powered help for your classroom</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handle_clear}>
          Clear Chat
        </Button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="px-4 pt-4">
          <Alert
            type="error"
            message={error}
            on_close={() => set_error(null)}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm'
              }`}
            >
              {/* Message content */}
              <div className="whitespace-pre-wrap text-sm">
                {message.content}
              </div>

              {/* Timestamp */}
              <div
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-primary-200' : 'text-gray-400'
                }`}
              >
                {format_time(message.timestamp)}
              </div>

              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handle_suggestion_click(suggestion)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {is_sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messages_end_ref} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <Card className="p-2">
          <div className="flex items-end gap-2">
            <textarea
              ref={input_ref}
              value={input_value}
              onChange={(e) => set_input_value(e.target.value)}
              onKeyDown={handle_key_down}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none border-0 focus:ring-0 text-sm max-h-32 p-2"
              style={{ minHeight: '40px' }}
              disabled={is_sending}
            />
            <Button
              onClick={() => handle_send()}
              disabled={!input_value.trim() || is_sending}
              is_loading={is_sending}
            >
              Send
            </Button>
          </div>
        </Card>
        <p className="text-xs text-gray-400 text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
