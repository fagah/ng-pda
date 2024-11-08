import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

// export const WS_ENDPOINT = 'ws://ec2-15-237-118-140.eu-west-3.compute.amazonaws.com:8081/pda-ws';
export const WS_ENDPOINT = 'ws://192.168.2.238:8081/pda-ws';
export interface IMessage {
  type: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private socket$: WebSocketSubject<any> | undefined;

  private messagesSubject = new Subject<IMessage>();
  public messages$ = this.messagesSubject.asObservable();

  constructor() {
    this.connect();
  }

  /**
   * Creates a new WebSocket subject and send it to the messages subject
   * @param cfg if true the observable will be retried.
   */
  public connect(): void {

    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket();

      this.socket$.subscribe(
        // Called whenever there is a message from the server
        msg => {
          console.log('Received message of type: ' + msg.type);
          this.messagesSubject.next(msg);
        }
      );
    }
  }

  sendMessage(msg: IMessage): void {
    console.log('sending message: ' + msg.type);
    this.socket$?.next(msg);
  }

  public disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = undefined;
    }
  }

  /**
   * Return a custom WebSocket subject which reconnects after failure
   */
  private getNewWebSocket(): WebSocketSubject<any> {
    return webSocket({
      url: WS_ENDPOINT,
      openObserver: {
        next: () => {
          console.log('[DataService]: connection ok');
        }
      },
      closeObserver: {
        next: () => {
          console.log('[DataService]: connection closed');
          this.socket$ = undefined;
          this.connect();
        }
      }
    });
  }
}
