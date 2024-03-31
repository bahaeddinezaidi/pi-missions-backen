import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatsRepository } from './chats.repository';
import { Chat, ChatSchema } from './shema/chats.Shema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsRepository],
  exports: [ChatsService],
})
export class ChatsModule {}
