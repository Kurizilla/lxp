import { Module } from '@nestjs/common';
import { SelectionController } from './selection/selection.controller';
import { SelectionService } from './selection/selection.service';
import { AssistantController } from './assistant/assistant.controller';
import { AssistantService } from './assistant/assistant.service';

@Module({
  imports: [],
  controllers: [SelectionController, AssistantController],
  providers: [SelectionService, AssistantService],
  exports: [SelectionService, AssistantService],
})
export class M01EstablecimientoModule {}
