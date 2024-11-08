import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RxStompService } from './rx-stomp.service';

@Injectable({
  providedIn: 'root'
})
export class PassengerWebRtcService {

  private peerConnection: RTCPeerConnection | null = null;
  private localStream: BehaviorSubject<MediaStream | null> = new BehaviorSubject<MediaStream | null>(null);
  private remoteStream: BehaviorSubject<MediaStream | null> = new BehaviorSubject<MediaStream | null>(null);
  private iceCandidatesQueue: RTCIceCandidate[] = [];

  constructor(public stompService: RxStompService) {
    
  }

  async initiateCall(user: any): Promise<void> {
    this.createPeerConnection(user);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localStream.next(stream);

    stream.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, stream);
    });

    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);

    // Send the offer to the agent through WebSocket
    this.stompService.sendMessage('/passenger/offer', JSON.stringify({
      type: 'offer',
      sdp: offer.sdp,
      stationId: user.stationId
    }));
  }

  /** Listens to WebSocket messages from the agent */
  public setupWebSocketListeners(user: any): void {
    this.stompService.watch('/topic/agent/answer').subscribe((message) => {
      const parsedMessage = JSON.parse(message.body);
      if (parsedMessage.type === 'answer') {
        this.handleAnswer(parsedMessage);
      } else if (parsedMessage.type === 'call-rejected') {
        alert('Call was rejected by the agent.');
      }
    });

    this.stompService.watch('/topic/passenger/ice-candidate').subscribe((message) => {
      const parsedMessage = JSON.parse(message.body);
      if (parsedMessage.type === 'candidate') {
        this.handleICECandidate(parsedMessage.candidate);
      }
    });

    this.stompService.watch('/topic/agent/hangup').subscribe(() => {
      this.endCall(user.stationId);
      alert('The agent has ended the call.');
    });
  }

  /** Sets the received answer as the remote description */
  private async handleAnswer(answerMessage: any): Promise<void> {
    const answerDesc = new RTCSessionDescription({
      type: 'answer',
      sdp: answerMessage.sdp
    });
    await this.peerConnection?.setRemoteDescription(answerDesc);

    // Add queued ICE candidates after setting the remote description
    while (this.iceCandidatesQueue.length) {
      const candidate = this.iceCandidatesQueue.shift();
      if (candidate) await this.peerConnection?.addIceCandidate(candidate);
    }
  }

  /** Sends ICE candidates to the agent */
  private handleICECandidate(candidate: RTCIceCandidateInit): void {
    const iceCandidate = new RTCIceCandidate(candidate);
    if (this.peerConnection && this.peerConnection.remoteDescription) {
      this.peerConnection.addIceCandidate(iceCandidate);
    } else {
      this.iceCandidatesQueue.push(iceCandidate);
    }
  }

  /** Ends the call and sends a hangup message */
  async endCall(stationId: string): Promise<void> {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.localStream.getValue()?.getTracks().forEach(track => track.stop());
    this.localStream.next(null);
    this.remoteStream.next(null);

    this.stompService.sendMessage('/passenger/hangup', JSON.stringify({ type: 'hangup', stationId }));
  }

  /** Creates the RTCPeerConnection and sets up ICE candidate handling */
  private createPeerConnection(user: any): void {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [          
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.l.google.com:19302" }]
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.stompService.sendMessage('/passenger/ice-candidate', JSON.stringify({
          type: 'candidate',
          candidate: event.candidate.toJSON(),
          stationId: user.stationId
        }));
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream.next(event.streams[0]);
      }
    };
  }

  /** Observables for local and remote streams */
  getLocalStream(): Observable<MediaStream | null> {
    return this.localStream.asObservable();
  }

  getRemoteStream(): Observable<MediaStream | null> {
    return this.remoteStream.asObservable();
  }
}
