import { Module } from '@nestjs/common';
import { BoardsModule } from '../boards/boards.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({
  imports: [WorkspacesModule, BoardsModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
