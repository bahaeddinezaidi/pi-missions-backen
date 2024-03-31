import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('chats')
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

//   @UseGuards(AuthGuard())
  @Post('create-chat')
  @ApiResponse({
    status: 201,
    description: 'The chat has been successfully created.',
  })
  async createChat(@Body() createChatDto: CreateChatDto) {
    return await this.chatsService.createChat(createChatDto);
  }

//   @UseGuards(AuthGuard())
  @Get(':id')
  async getAllChatsByUserId(@Param(':id') id: string) {
    return await this.chatsService.findAllChats(id);
  }
  
  @UseGuards(AuthGuard())
  @Post(':id/add-members')
  async addMembersToChat(@Param('id') chatId: string, @Body() members: string[]) {
    return await this.chatsService.addMembersToChat(chatId, members);
  }
}
