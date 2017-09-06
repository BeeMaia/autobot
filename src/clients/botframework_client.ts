'use strict';

import {
  DirectLine,
  ConnectionStatus,
  Activity,
  Message as BotMessage } from 'botframework-directlinejs';
import { Client } from './client_interface';
import { Message, MessageType } from '../spec/message';

// // HAX: This is necessary for Node.js
// // https://github.com/Microsoft/BotFramework-DirectLineJS/issues/20
const globalAny:any = global;
globalAny.XMLHttpRequest = require('xhr2');

export class BotFrameworkClient extends Client {
  private conectionStatus: ConnectionStatus;
  private directLine: DirectLine;
  private messageIdToUser = new Map<string, string>();
  private onReadyCb: () => void;

  constructor(directLineSecret: string) {
    super();
    this.directLine = new DirectLine({ secret: directLineSecret });
    this.subscribeToConnectionStatus();
  }

  public send(message: Message) {
    const activity : Activity = {
      from: { id: message.user, name: message.user },
      type: 'message',
      text: message.text,
    };
    // console.log(`POSTING: ${activity.text}`);
    this.directLine
    .postActivity(activity)
    .subscribe(
      id => null,
      error => console.log('DirectLine error, can\'t send: ', error),
    );
  }

  public onReply(callback: (message: Message) => void) {
    this.directLine.activity$
    .filter(activity => activity.type === 'message')
    .subscribe((dlMessage: any) => {
      // console.log(`RECEIVED: ${JSON.stringify(dlMessage)}`);
      if (dlMessage.from.id.indexOf('testuser') !== -1) {
        // Outbound message
        this.messageIdToUser.set(dlMessage.id, dlMessage.from.name);
      } else {
        // inbound message
        const user = this.messageIdToUser.get(dlMessage.replyToId);
        if (user === undefined) {
          console.log('Unrecognized conversation on directline', dlMessage);
          return;
        }
        // TODO: Handle cards and images
        if (dlMessage.text) {
          const message: Message = {
            user,
            messageType: MessageType.Text,
            text: dlMessage.text,
          };
          callback(message);
        }
      }
    });
  }

  onReady() {
    return new Promise<void>((resolve) => {
      if (this.conectionStatus === ConnectionStatus.Online) {
        resolve();
      } else {
        this.onReadyCb = resolve;
      }
    });
  }

  public close() {
    this.directLine.end();
  }

  // Only for debugging purposes
  private subscribeToConnectionStatus() {
    // Monitor connection status
    this.directLine.connectionStatus$
      .subscribe((connectionStatus) => {
        this.conectionStatus = connectionStatus;
        switch (connectionStatus) {
          case ConnectionStatus.Uninitialized:
            // the status when the DirectLine object is first created/constructed
            break;
          case ConnectionStatus.Connecting:
            // currently trying to connect to the conversation
            console.log('Connecting to DirectLine...');
            break;
          case ConnectionStatus.Online:
            // successfully connected to the converstaion. Connection is healthy so far as we know.
            console.log('Connected to DirectLine.');
            if (this.onReadyCb) {
              this.onReadyCb();
            }
            break;
          case ConnectionStatus.ExpiredToken:
            // last operation errored out with an expired token. Your app should supply a new one.
            console.log('DirectLine error: token expired.');
            process.exit(1);
            break;
          case ConnectionStatus.FailedToConnect:
            // the initial attempt to connect to the conversation failed. No recovery possible.
            console.log('DirectLine error: failed to connect.');
            process.exit(1);
            break;
          case ConnectionStatus.Ended:
            // the bot ended the conversation
            break;
        }
      });
  }
}

export default Client;
