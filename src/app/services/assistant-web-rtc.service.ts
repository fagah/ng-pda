import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RxStompService } from './rx-stomp.service';

@Injectable({
  providedIn: 'root'
})
export class AssistantWebRtcService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: BehaviorSubject<MediaStream | null> = new BehaviorSubject<MediaStream | null>(null);
  private remoteStream: BehaviorSubject<MediaStream | null> = new BehaviorSubject<MediaStream | null>(null);
  private iceCandidatesQueue: RTCIceCandidate[] = [];

  constructor(public stompService: RxStompService) {}

  /** Receives the offer from the passenger and prepares to answer */
  async handleOffer(rtcSessionDescriptionInit: RTCSessionDescriptionInit, stationId: string): Promise<void> {
    this.createPeerConnection(stationId);
    const offerDesc = new RTCSessionDescription({
      type: 'offer',
      sdp: rtcSessionDescriptionInit.sdp
    });
    await this.peerConnection!.setRemoteDescription(offerDesc);

    // Start the local media stream for the agent (video/audio)
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localStream.next(stream);
    stream.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, stream);
    });

    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);

    // Send the answer to the passenger through WebSocket
    this.stompService.sendMessage('/agent/answer', JSON.stringify({
      type: 'answer',
      sdp: answer.sdp,
      stationId
    }));
  }

  /** Sets the received ICE candidate */
  public handleICECandidate(candidate: RTCIceCandidateInit): void {
    const iceCandidate = new RTCIceCandidate(candidate);
    if (this.peerConnection && this.peerConnection.remoteDescription) {
      this.peerConnection.addIceCandidate(iceCandidate);
    } else {
      this.iceCandidatesQueue.push(iceCandidate);
    }
  }

  /** Sends ICE candidates to the passenger */
  private sendICECandidate(candidate: RTCIceCandidate, stationId: string): void {
    this.stompService.sendMessage('/agent/ice-candidate', JSON.stringify({
      type: 'candidate',
      candidate: candidate.toJSON(),
      stationId // Replace with actual agent station ID
    }));
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

    this.stompService.sendMessage('/agent/hangup', JSON.stringify({ type: 'hangup', stationId }));
  }

  /** Creates the RTCPeerConnection for the agent */
  private createPeerConnection(stationId: string): void {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.l.google.com:19302" }
      ]
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendICECandidate(event.candidate, stationId);
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
