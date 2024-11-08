import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { RTCPeerConfiguration } from './app.constants';
import { DataService, IMessage } from './services/data.service';
import { RxStompService } from './services/rx-stomp.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { SharedModule } from './shared/shared.module';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserDetailComponent } from './user-detail/user-detail.component';

export const ENV_RTCPeerConfiguration = RTCPeerConfiguration;

const mediaConstraints = {
  audio: true,
  video: { width: 1280, height: 720 },
};

const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true,
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, SharedModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [NgbActiveModal],
})
export class AppComponent 
// implements AfterViewInit, OnDestroy 
{
  title = 'ng-pda';
  currentUserJson = JSON.parse(localStorage.getItem('currentUser') || '{}');

  constructor(private router: Router, private modalService: NgbModal,) {
    // const currentUserJson = JSON.parse(localStorage.getItem('currentUser')||'');
    if( this.currentUserJson && this.currentUserJson.stationGroup){
      this.navigateTo(this.currentUserJson.stationGroup);
    } else {
      this.gatherCurrentUserInfo();
    }
  }
  // private messagesSubscription?: Subscription;
  // @ViewChild('local_video') localVideo!: ElementRef;
  // @ViewChild('received_video') remoteVideo!: ElementRef;

  // private peerConnection: RTCPeerConnection | null = null;
  // private localStream: MediaStream | null = null;

  // inCall = false;
  // localVideoActive = false;
  // isCameraOn: boolean = true;
  // isMicOn: boolean = true;
  // stationId?: string;
  // stationGroup?: string;

  // constructor(
  //   private dataService: DataService,
  //   private rxStompService: RxStompService,
  //   private modalService: NgbModal,
  // ) {}

  // ngAfterViewInit(): void {
    
  //   if (!this.stationId && !this.stationGroup) {
  //     this.gatherCurrentUserInfo();
  //   } else {
  //     this.addIncomingMessageHandler();
  //     this.requestMediaDevices();
  //   }

  // }

  // ngOnDestroy(): void {
  //   if (this.messagesSubscription) {
  //     this.messagesSubscription.unsubscribe();
  //     this.dataService.disconnect();
  //   }
  // }

  gatherCurrentUserInfo(): void {
    const modalRef = this.modalService.open(UserDetailComponent,{
      backdrop: 'static',
      keyboard: false,
      size: 'md'
    });

    modalRef.componentInstance.userDetail = { stationId: this.currentUserJson.stationId, stationGroup: this.currentUserJson.stationGroup };

    modalRef.result.then(async (result) => {
      if (result !== null) {
        this.currentUserJson = result;
        localStorage.setItem('currentUser', JSON.stringify(result));
        this.navigateTo(result.stationGroup);
      }
    }, (reason) => {
      console.log('Dismissed : ', reason);
    });
  }

  private navigateTo(currentUserRole: string){
    switch (currentUserRole) {
      case 'passenger':
        this.router.navigate(['/passenger-ui']);
        break;
      case 'agent':
        this.router.navigate(['/agent-ui']);
        break;
      default:
        alert('Unknown role');
        break;
    }
  }

  // async call(): Promise<void> {
  //   this.createPeerConnection();
  //   if (!this.localStream || !this.peerConnection) {
  //     console.log('No local stream or peer connection');
  //     return;
  //   }
  //   this.localStream.getTracks().forEach(track => this.peerConnection!.addTrack(track, this.localStream!));

  //   try {
  //     const offer = await this.peerConnection.createOffer(offerOptions);
  //     await this.peerConnection.setLocalDescription(offer);
  //     this.inCall = true;
  //     this.rxStompService.publish({ destination: '/topic/passenger/offer', body: JSON.stringify({ stationId: this.stationId, type: 'offer', data: offer }) });
  //   } catch (err: any) {
  //     this.handleGetUserMediaError(err);
  //   }
  // }

  // hangUp(): void {
  //   this.rxStompService.publish({ destination: '/topic/hangup', body: JSON.stringify({stationId: this.stationId, type: 'hangup', data: '' }) });
  //   this.closeVideoCall();
  // }

  // toggleCamera(): void {
  //   if (this.localStream) {
  //     this.isCameraOn = !this.isCameraOn;
  //     this.localStream.getVideoTracks().forEach(track => (track.enabled = this.isCameraOn));
  //   }
  // }

  // toggleMic(): void {
  //   if (this.localStream) {
  //     this.isMicOn = !this.isMicOn;
  //     this.localStream.getAudioTracks().forEach(track => (track.enabled = this.isMicOn));
  //   }
  // }

  // startLocalVideo(): void {
  //   console.log('starting local stream');
  //   this.localStream?.getTracks().forEach(track => {
  //     track.enabled = true;
  //   });
  //   this.localVideo.nativeElement.srcObject = this.localStream;

  //   this.localVideoActive = true;
  // }

  // pauseLocalVideo(): void {
  //   console.log('pause local stream');
  //   this.localStream?.getTracks().forEach(track => {
  //     track.enabled = false;
  //   });
  //   this.localVideo.nativeElement.srcObject = undefined;

  //   this.localVideoActive = false;
  // }

  // private addIncomingMessageHandler(): void {
  //   this.messagesSubscription = this.rxStompService
  //     .watch('/topic/messages')
  //     .pipe(
  //       map(message => JSON.parse(message.body)),
  //       filter((msg: IMessage) => !!msg)
  //     )
  //     .subscribe((msg: IMessage) => {
  //       switch (msg.type) {
  //         case 'offer':
  //           this.handleOfferMessage(msg.data);
  //           break;
  //         case 'answer':
  //           this.handleAnswerMessage(msg.data);
  //           break;
  //         case 'hangup':
  //           this.handleHangupMessage();
  //           break;
  //         case 'ice-candidate':
  //           this.handleICECandidateMessage(msg.data);
  //           break;
  //         default:
  //           console.log(`Unknown message type: ${msg.type}`);
  //       }
  //     }, error => console.error(error));
  // }

  // private async requestMediaDevices(): Promise<void> {
  //   try {
  //     this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
  //     this.pauseLocalVideo();
  //   } catch (e: any) {
  //     console.error(`getUserMedia() error: ${e.name}`);
  //     alert(`Error accessing camera/microphone: ${e.message}`);
  //   }
  // }

  // private createPeerConnection(): void {
  //   console.log('Creating PeerConnection...');
  //   this.peerConnection = new RTCPeerConnection(ENV_RTCPeerConfiguration);
  //   this.peerConnection.onicecandidate = this.handleICECandidateEvent;
  //   this.peerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
  //   this.peerConnection.onsignalingstatechange = this.handleSignalingStateChangeEvent;
  //   this.peerConnection.ontrack = this.handleTrackEvent;
  // }

  // private handleOfferMessage(msg: RTCSessionDescriptionInit): void {
  //   if (!this.peerConnection) {
  //     this.createPeerConnection();
  //   }
  //   this.peerConnection
  //     ?.setRemoteDescription(new RTCSessionDescription(msg))
  //     .then(() => this.peerConnection?.createAnswer())
  //     .then(answer => {
  //       return this.peerConnection?.setLocalDescription(answer);
  //     })
  //     .then(() => {
  //       this.rxStompService.publish({ destination: '/topic/answer', body: JSON.stringify({ stationId: this.stationId, type: 'answer', data: this.peerConnection?.localDescription }) });
  //       this.inCall = true;
  //     })
  //     .catch(this.handleGetUserMediaError);
  // }

  // private handleAnswerMessage(msg: RTCSessionDescriptionInit): void {
  //   this.peerConnection?.setRemoteDescription(msg);
  // }

  // private handleHangupMessage(): void {
  //   this.closeVideoCall();
  // }

  // private handleICECandidateMessage(msg: RTCIceCandidate): void {
  //   const candidate = new RTCIceCandidate(msg);
  //   this.peerConnection?.addIceCandidate(candidate).catch(this.reportError);
  // }

  // private closeVideoCall(): void {
  //   if (this.peerConnection) {
  //     this.peerConnection.getTransceivers().forEach(transceiver => transceiver.stop());
  //     this.peerConnection.close();
  //     this.peerConnection = null;
  //     this.inCall = false;
  //   }
  // }

  // private handleGetUserMediaError(error: Error): void {
  //   console.error('Error accessing media:', error);
  //   this.closeVideoCall();
  // }

  // private reportError = (error: Error) => {
  //   console.error('WebRTC error:', error);
  // }

  // private handleICECandidateEvent = (event: RTCPeerConnectionIceEvent) => {
  //   if (event.candidate) {
  //     this.rxStompService.publish({ destination: '/topic/ice-candidate', body: JSON.stringify({ type: 'ice-candidate', data: event.candidate }) });
  //   }
  // }

  // private handleICEConnectionStateChangeEvent = () => {
  //   switch (this.peerConnection?.iceConnectionState) {
  //     case 'closed':
  //     case 'failed':
  //     case 'disconnected':
  //       this.closeVideoCall();
  //       break;
  //   }
  // }

  // private handleSignalingStateChangeEvent = () => {
  //   if (this.peerConnection?.signalingState === 'closed') {
  //     this.closeVideoCall();
  //   }
  // }

  // private handleTrackEvent = (event: RTCTrackEvent) => {
  //   this.remoteVideo.nativeElement.srcObject = event.streams[0];
  // }
}
