import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

//   @UseGuards(AuthGuard())
  @Post('create-message')
  @ApiResponse({
    status: 201,
    description: 'The message has been successfully created.',
  })
  async createMessage(@Body() createMessageDto: CreateMessageDto) {
    return await this.messagesService.createMessage(createMessageDto);
  }

//   @UseGuards(AuthGuard())
  @Get(':id')
  async getAllMessagesByChatId(@Param('id') id: string) {
    return await this.messagesService.findAllMessages(id);
  }
}
