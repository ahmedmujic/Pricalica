import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Peer from 'peerjs';
import { HubService } from 'src/app/services/hub.service';

interface GroupMember {
  userName: string;
  displayName: string;
}
interface VideoElement {
  muted: boolean;
  srcObject: MediaStream;
  member: GroupMember;
}

interface Message{
  message: string;
  username: string;
}

interface IncommingMessage extends Message{
  dateTime: Date;
}

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css'],
})
export class RoomComponent implements OnInit, AfterViewInit {
  roomId!: string | null;
  username!: string | null;
  myPeer!: Peer;
  peerId!: string;
  stream: any;
  message!: string;

  @ViewChild('video') localVideoPlayer!: ElementRef;
  @ViewChild('chat') chat!: ElementRef;
  enableVideo: boolean = true;
  enableAudio: boolean = true;
  videos: VideoElement[] = [];
  callingPeerId!: string;
  metadata!: GroupMember;

  constructor(private route: ActivatedRoute, private hubService: HubService, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.hubService.incommingMessageSubject.subscribe((incommingMessage: IncommingMessage) => {
      const message: HTMLParagraphElement = this.renderer.createElement('p');
      const date: HTMLParagraphElement = this.renderer.createElement('p');
      message.innerHTML = incommingMessage.message;
      date.innerHTML = new Date(incommingMessage.dateTime).getDate().toString();
      this.renderer.appendChild(this.chat.nativeElement, message);
      this.renderer.appendChild(this.chat.nativeElement, date);
    })
  }
  async ngOnInit() {


    this.route.queryParams.subscribe((params) => {
      this.roomId = params['id'];
      this.username = params['username'];
      this.metadata = {
        displayName: params['username'],
        userName: params['username'],
      };
    });
    this.hubService.createHubConnection(
      { username: this.username ?? '' },
      this.roomId ?? ''
    );

    await this.createLocalStream();
    this.myPeer = new Peer();

    this.myPeer.on('open', (id: string) => {
      console.log(id);
      this.peerId = id;
    });

    this.myPeer.on('call', (call) => {
      call.answer(this.stream);
      call.on('stream', (otherUser: MediaStream) => {
        const alreadyExisting = this.videos.findIndex(
          (video) => video.member.userName === call.metadata.userName
        );
        if (alreadyExisting != -1) {
          return;
        }
        this.videos = [
          ...this.videos,
          {
            muted: false,
            srcObject: otherUser,
            member: {
              userName: call.metadata.userName,
              displayName: call.metadata.userName,
            },
          },
        ];
      });
    });
  }

  async createLocalStream() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: this.enableVideo,
      audio: this.enableAudio,
    });
    this.localVideoPlayer.nativeElement.srcObject = this.stream;
    this.localVideoPlayer.nativeElement.load();
    this.localVideoPlayer.nativeElement.play();
  }

  callUser() {
    this.myPeer.call(this.callingPeerId, this.stream, {
      metadata: this.metadata,
    });
  }

  sendMessage(){
    this.hubService.sendMessage({message: this.message, username: this.username as string}).then(data => {console.log(data)});
  }
}
