'use strict';

import { DirectLine, ConnectionStatus, Activity, Message } from 'botframework-directlinejs';

// HAX: This is necessary for Node.js
// https://github.com/Microsoft/BotFramework-DirectLineJS/issues/20
global.XMLHttpRequest = require("xhr2");

export class Client {

  id = 'e2e';
  name = 'e2e';

  directLine: DirectLine;

  constructor(directLineSecret: string) {
    this.directLine = new DirectLine({ secret: directLineSecret });
  }

  public send(text: string) {
    const activity : Activity = {
      from: { id: this.id, name: this.name },
      type: 'message',
      text: text,
    };
    console.log(`POSTING: '${activity.text}'`);
    this.directLine
    .postActivity(activity)
    .subscribe(
      id => {},
      error => console.log("ERROR: posting activity: ", error)
    );
  }

  private subscribeToReplies() {
    console.log('CLIENT: Subscribing to messages');
    this.directLine.activity$
    .filter(activity => activity.type === 'message' && activity.from.id !== this.id)
    .subscribe(message => {
      const msg = message as Message;
      console.log(`RECEIVED: '${msg.text}'`);
    });
  }

  private subscribeToConnectionStatus() {
    // Monitor connection status
    this.directLine.connectionStatus$
    .subscribe(connectionStatus => {
        switch(connectionStatus) {
            case ConnectionStatus.Uninitialized:
              // the status when the DirectLine object is first created/constructed
              console.log('CONNECTION: Uninitialized');
              break;
            case ConnectionStatus.Connecting:
              // currently trying to connect to the conversation
              console.log('CONNECTION: Connecting');
              break;
            case ConnectionStatus.Online:
              // successfully connected to the converstaion. Connection is healthy so far as we know.
              console.log('CONNECTION: Online');
              break;
            case ConnectionStatus.ExpiredToken:
              // last operation errored out with an expired token. Your app should supply a new one.
              console.log('CONNECTION: ExpiredToken');
              break;
            case ConnectionStatus.FailedToConnect:
              // the initial attempt to connect to the conversation failed. No recovery possible.
              console.log('CONNECTION: Failed');
              break;
            case ConnectionStatus.Ended:
              // the bot ended the conversation
              console.log('CONNECTION: Ended');
              break;
        }
    });
  }
}

export default Client;
