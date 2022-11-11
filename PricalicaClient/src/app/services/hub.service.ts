import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IncommingMessage, Message } from '../models/stream.interfaces';
import { User } from '../models/user.interfaces';

@Injectable({
  providedIn: 'root',
})
export class HubService {
  private hubConnection!: HubConnection;
  incommingMessageSubject: BehaviorSubject<IncommingMessage> = new BehaviorSubject<IncommingMessage>({message: 'Dobrodošli', username: 'bot', dateTime: new Date()});
  usersConnected: Subject<User[]> = new Subject<User[]>();

  createHubConnection(user: User, roomId: string, peerId: string, isHost: boolean) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(
        environment.hubUrl + '?roomId=' + roomId + '&username=' + user.username + '&peerId=' + peerId
      )
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start().then(_=>{
      this.hubConnection.on('UsersInGroup', (users: User[]) => {
        this.usersConnected.next(users);
      });

      this.hubConnection.on('NewMessage', (message: IncommingMessage) => {
        this.incommingMessageSubject.next(message);
      });

      if(!isHost){
        this.hubConnection.invoke('GetOtherUsersInRoom')
      }
    }).catch((err) => console.log(err));
  }

  sendMessage(message: Message){
    return this.hubConnection.invoke('SendMessage', message)
  }
}
