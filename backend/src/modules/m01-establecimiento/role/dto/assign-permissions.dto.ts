import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class AssignPermissionsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  permission_ids: string[];
}
