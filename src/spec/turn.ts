import { DialogueInvalidError } from './dialogueInvalidError';
import { Response } from './response';
enum Speaker {
  Human,
  Bot,
}
export class Turn {
  speaker: Speaker;
  responses: Response[];

  constructor(turnData: any) {
    let data;
    if (turnData.Human) {
      this.speaker = Speaker.Human;
      data = turnData.Human;
    } else if (turnData.Bot) {
      this.speaker = Speaker.Bot;
      data = turnData.Bot;
    } else {
      throw new DialogueInvalidError('No Human or Bot key on ${JSON.stringify(turnData)}');
    }

    if (typeof data === "string") {
      data = [data];
    }
    this.responses = data.map(responseData => new Response(responseData));
  }
}
