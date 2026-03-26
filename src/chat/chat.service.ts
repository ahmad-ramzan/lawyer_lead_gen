import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TEMPLATE_QUESTIONS } from './templates/questions';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getNextQuestion(matterId: string, step: number) {
    const matter = await this.prisma.matter.findUnique({ where: { id: matterId } });
    if (!matter) throw new NotFoundException('Matter not found');

    const questions = TEMPLATE_QUESTIONS[matter.code];
    if (!questions) throw new NotFoundException('No questions for this matter type');
    if (step < 0 || step >= questions.length) throw new BadRequestException('Invalid step');

    return {
      question: questions[step],
      step,
      is_last: step === questions.length - 1,
    };
  }
}
