import { ChatService } from './chat.service';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
    getNextQuestion(body: {
        matter_id: string;
        step: number;
        answer?: string;
    }): Promise<{
        question: string;
        step: number;
        is_last: boolean;
    }>;
}
