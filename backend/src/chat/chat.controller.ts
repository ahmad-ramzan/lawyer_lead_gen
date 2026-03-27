import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  // Public — no auth required (clients browse without login)
  @Post('next')
  getNextQuestion(
    @Body() body: { matter_id: string; step: number; answer?: string },
  ) {
    return this.chatService.getNextQuestion(body.matter_id, body.step);
  }
}
