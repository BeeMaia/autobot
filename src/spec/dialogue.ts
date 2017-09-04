import { Turn } from './turn';
import { DialogueInvalidError } from './dialogue_invalid_error';
import * as jsYaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

export class Dialogue {
  title: string;
  turns: Turn[];

  constructor(filePath: string) {
    let dialogueDoc;
    try {
      dialogueDoc = jsYaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
      if (!dialogueDoc) {
        throw new DialogueInvalidError('Not a valid yaml: ${filePath}');
      }
    } catch (e) {
      if (e instanceof jsYaml.YAMLException) {
        throw new DialogueInvalidError(`File is not valid YAML: ${e.message}`);
      } else {
        throw new DialogueInvalidError(e.message);
      }
    }
    this.title = dialogueDoc.Title ?
      dialogueDoc.Title :
      path.basename(filePath, path.extname(filePath));
    if (!dialogueDoc.Dialogue) {
      throw new DialogueInvalidError('No dialogue found');
    }

    this.turns = dialogueDoc.Dialogue.map(turnData => new Turn(turnData));
  }
}
