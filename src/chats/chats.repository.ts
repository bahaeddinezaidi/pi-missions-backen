import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatDo } from './dto/chat.dto';


export class ChatsRepository {
  constructor(
    @InjectModel('Chat')
    private chatModel: Model<ChatDo>,
  ) {}

  async createChat(chat): Promise<any> {
    const createOne = await this.chatModel.create(chat);
    return createOne;
  }

  async findAllChats(id): Promise<any> {
    const findAll = await this.chatModel.find({ members: { $all: [id] } });
    return findAll;
  }
  async addMembersToChat(chatId: string, members: string[]) {
    return await this.chatModel.findByIdAndUpdate(chatId, { $addToSet: { members: { $each: members } } }, { new: true });
  }
}
