import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Peer from 'peerjs';
import { HubService } from 'src/app/services/hub.service';
import { Guid } from 'js-guid';
import { GroupMember, User } from 'src/app/models/user.interfaces';
import { IncommingMessage, VideoElement } from 'src/app/models/stream.interfaces';
import {  Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit, AfterViewInit, OnDestroy {
  roomId!: string | null;
  username!: string | null;
  myPeer!: Peer;
  peerId!: string;
  stream: any;
  message!: string;
  isHost!: boolean;
  connectedPeers: string[] = [];

  @ViewChild('video') localVideoPlayer!: ElementRef;
  @ViewChild('chat') chat!: ElementRef;
  enableVideo: boolean = true;
  enableAudio: boolean = true;
  videos: VideoElement[] = [];
  usersInCall: User[] = [];
  callingPeerId!: string;
  metadata!: GroupMember;

  destroySubject = new Subject();

  constructor(private route: ActivatedRoute, private hubService: HubService, private renderer: Renderer2) {}

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  ngAfterViewInit(): void {
    this.hubService.incommingMessageSubject.pipe(takeUntil(this.destroySubject)).subscribe((incommingMessage: IncommingMessage) => {
      const message: HTMLParagraphElement = this.renderer.createElement('p');
      const date: HTMLParagraphElement = this.renderer.createElement('p');
      const recievedDate = new Date(incommingMessage.dateTime);
      message.innerHTML = incommingMessage.message;
      date.innerHTML = recievedDate.getDay() + "/" + (recievedDate.getMonth()+1) + "/" + recievedDate.getFullYear();
      if(this.username == incommingMessage.username){
        message.classList.add('text-end');
        date.classList.add('text-end')
      }
      this.renderer.appendChild(this.chat.nativeElement, date);
      this.renderer.appendChild(this.chat.nativeElement, message);
    })
  }

  async ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.destroySubject)).subscribe((params) => {
      this.roomId = params['id'] ?? Guid.newGuid();
      this.username = params['username'];
      this.metadata = {
        displayName: params['username'],
        userName: params['username'],
      };

      this.isHost = params['id'] == null;
    });

    await this.createLocalStream();
    this.myPeer = new Peer();

    this.myPeer.on('open', (id: string) => {
      this.peerId = id;

      this.hubService.createHubConnection(
        { username: this.username ?? '' },
        this.roomId ?? '',
        this.peerId
      );
    });

    this.myPeer.on('call', (call) => {
      call.answer(this.stream);

        //this.callUser(call.peer);
        this.connectedPeers.push(call.peer);
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

    this.hubService.usersConnected.pipe(takeUntil(this.destroySubject)).subscribe((users: User[])=> {
      debugger;
        if(this.isHost){
          users.forEach(user => {
            if(this.usersInCall.findIndex(uc => uc.peerId == user.peerId) == -1 && this.peerId != user.peerId){
              this.callUser(user.peerId as string);
              this.usersInCall.push(user);
            }
          })
        }
    })
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

  callUser(callingPeer: string) {
    let call = this.myPeer.call(callingPeer, this.stream, {
      metadata: this.metadata,
    });

    call.on('stream', (remoteStream) => {
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
          srcObject: remoteStream,
          member: {
            userName: call.metadata.userName,
            displayName: call.metadata.userName,
          },
        },
      ];
    });
  }

  sendMessage(){
    this.hubService.sendMessage({message: this.message, username: this.username as string}).then(data => {console.log(data)});
  }
}


