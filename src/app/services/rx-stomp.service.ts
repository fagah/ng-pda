import { Injectable, OnDestroy } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { rxStompConfig } from './rx-stomp.config';
import { Observable, Subject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RxStompService extends RxStomp implements OnDestroy {

  private messagesSubject = new Subject<any>();
  
  constructor() {
    super();
    // this.connect();
  }
  public connect(user: any) {
    this.configure(rxStompConfig);
    this.activate();

    this.connected$.subscribe(() => {
      console.log('Connected to STOMP broker');
      this.subscribeToMessages(user);
    });

    // this. $.subscribe(() => {
    //   console.log('Connection to STOMP broker closed');
    // });

    this.stompErrors$.subscribe((error) => {
      console.error('Connection error: ', error);
    });
  }

  sendMessage(destination: string, body: any): void {
    console.log('Sending message to ' + destination);
    console.log(body);
    const finalUrl = `/app${destination}`;
    this.publish({ destination: finalUrl, body: body });
  }

  subscribeToTopic(topic: string): Observable<any> {
    const subject = new Subject<any>();
    this.watch(topic).subscribe((message: any) => {
      subject.next(JSON.parse(message.body));
    });
    return subject.asObservable();
  }

  get messages$() {
    return this.messagesSubject.asObservable();
  }

  private subscribeToMessages(currentUser: any) {

    this.stompClient.subscribe(`/topic/${currentUser.stationGroup}/available`, (message: any) => {
      const parsedMessage = JSON.parse(message.body);
      this.messagesSubject.next(parsedMessage);
    });
    
    this.stompClient.subscribe(`/topic/${currentUser.stationGroup}/${currentUser.stationId}`, (message: any) => {
      const parsedMessage = JSON.parse(message.body);
      this.messagesSubject.next(parsedMessage);
    });
  }



  ngOnDestroy(): void {
    this.messagesSubject.complete();
    this.deactivate();
  }
}
