import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('next')
  @Roles('client')
  getNextQuestion(
    @Body() body: { matter_id: string; step: number; answer?: string },
  ) {
    return this.chatService.getNextQuestion(body.matter_id, body.step);
  }
}
