import { inject, Injectable } from '@angular/core';
import { RxStompService } from './rx-stomp.service';
import { BehaviorSubject, Observable } from 'rxjs';

const ICE_SERVERS_LIST = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

@Injectable({
  providedIn: 'root'
})
export class WebRTCService {

  protected stompService: RxStompService = inject(RxStompService);

  private peerConnection: RTCPeerConnection | null = null;
  private localStream: BehaviorSubject<MediaStream | null> = new BehaviorSubject<MediaStream | null>(null);
  private remoteStream: BehaviorSubject<MediaStream | null> = new BehaviorSubject<MediaStream | null>(null);
  private iceCandidatesQueue: RTCIceCandidate[] = [];

  // call this to initiate a peer connection and start the call
  async startCall(user: any): Promise<void> {
    this.createPeerConnection(user);

    // Access local media and publish it
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if( !stream || !this.peerConnection ){
      alert('Failed to get local media');
      return;
    }
    this.localStream.next(stream); // Publish the local stream

    // Add the tracks to the peer connection
    stream.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, stream);
    });


    // Send offer
    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);
    this.stompService.sendMessage('/passenger/offer', JSON.stringify({ type: offer.type, sdp: offer.sdp, data: offer, stationId: user.stationId }));
  }

  // call this when an offer is received from the passenger
  async handleOffer(offer: RTCSessionDescriptionInit, user: any): Promise<void> {

    if(!this.peerConnection){
      this.createPeerConnection(user);
    }
    
    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);
    // this.stompService.sendMessage('/agent/answer', JSON.stringify(answer));
  }

  // Handle  answer  received from an agent
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

      // Process any ICE candidates that were received before the remote description
      while (this.iceCandidatesQueue.length) {
        const candidate = this.iceCandidatesQueue.shift();
        if (candidate) await this.peerConnection.addIceCandidate(candidate);
      }
    } else{
      console.error('Peer connection is not initialized');
    }
  }

  // handle ICE candidate received from signaling server
  async handleICECandidate(candidate: RTCIceCandidate): Promise<void> {
    if( candidate && candidate.sdpMid && candidate.sdpMLineIndex ){
      console.debug(`proceed to - candidate: ${JSON.stringify(candidate)}`);
      const iceCandidate = new RTCIceCandidate(candidate);
      if (this.peerConnection && this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(iceCandidate);
      } else {
        this.iceCandidatesQueue.push(iceCandidate);
      }
    }else{
      console.error('Invalid ICE candidate');
    }
  }

  getLocalStream(): Observable<MediaStream | null> {
    return this.localStream.asObservable();
  }

  setLocalStream(stream: MediaStream): void {
    this.localStream.next(stream);
  }

  // Set remote video element observable
  getRemoteStream(): Observable<MediaStream | null> {
    return this.remoteStream.asObservable();
  }

  setRemoteStream(stream: MediaStream): void {
    this.remoteStream.next(stream);
  }

  getStompService(): RxStompService {
    return this.stompService;
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  // Close the connection and release media devices
  async endCall(userId: any): Promise<void> {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.localStream.getValue()?.getTracks().forEach(track => track.stop());
    this.localStream.next(null);
    this.remoteStream.next(null);

    this.stompService.sendMessage('/hangup', JSON.stringify({stationId: userId, type: 'hangup'}));
  }

  // Create and configure a peer connection
  private createPeerConnection(user: any): void {
    this.peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS_LIST
    });

    // Handle ICE candidates
    this.peerConnection.onicecandidate = event => {
      console.debug(`createPeerConnection - onicecandidate: ${JSON.stringify(event.candidate)}`);
      if (event.candidate) {
        const p = {
          type: 'candidate',
          candidate: JSON.stringify(event.candidate),
          stationId: user.stationId,
        }
        this.stompService.sendMessage( `/${user.stationGroup}/ice-candidate`, JSON.stringify(p));
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = event => {
      if (event.streams && event.streams[0]) {
        this.remoteStream.next(event.streams[0]);
      }
    };
  }

}
