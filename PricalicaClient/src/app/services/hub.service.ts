import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../models/user.interface';

interface Message{
  message: string;
  username: string;
}

interface IncommingMessage extends Message{
  dateTime: Date;
}

@Injectable({
  providedIn: 'root',
})
export class HubService {
  private hubConnection!: HubConnection;
  incommingMessageSubject: BehaviorSubject<IncommingMessage> = new BehaviorSubject<IncommingMessage>({message: 'Dobrodošli', username: 'bot', dateTime: new Date()});

  constructor() {
  }

  createHubConnection(user: User, roomId: string) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(
        environment.hubUrl + '?roomId=' + roomId + '&username=' + user.username
      )
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start().catch((err) => console.log(err));

    this.hubConnection.on('UserOnlineInGroup', (user: string) => {
      console.log(user);
    });

    this.hubConnection.on('NewMessage', (message: IncommingMessage) => {
      this.incommingMessageSubject.next(message);
    });
  }

  sendMessage(message: Message){
    return this.hubConnection.invoke('SendMessage', message)
  }
}
