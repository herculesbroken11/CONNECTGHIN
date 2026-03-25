import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload.type';

@Controller('conversations')
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.messaging.listConversations(user.sub);
  }

  @Post('start')
  start(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartConversationDto,
  ) {
    return this.messaging.startConversation(user.sub, dto.otherUserId);
  }

  @Get(':conversationId/messages')
  messages(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    const n = take ? parseInt(take, 10) : 40;
    return this.messaging.getMessages(user.sub, conversationId, cursor, n);
  }

  @Post(':conversationId/messages')
  send(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messaging.sendMessage(user.sub, conversationId, dto);
  }

  @Patch(':conversationId/read')
  read(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.messaging.markRead(user.sub, conversationId);
  }
}
