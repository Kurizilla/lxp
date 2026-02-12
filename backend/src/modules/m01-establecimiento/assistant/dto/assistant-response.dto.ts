export class AssistantResponseDto {
  response: string;
  context: {
    institutionId?: number;
    classroomId?: number;
    timestamp: string;
  };
  metadata: {
    model: string;
    isStub: boolean;
  };
}
