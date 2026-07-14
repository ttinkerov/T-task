import { Module } from '@nestjs/common';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { PublicFormsController } from './public-forms.controller';

@Module({
  imports: [WorkspacesModule],
  controllers: [FormsController, PublicFormsController],
  providers: [FormsService],
})
export class FormsModule {}
