import { GroupMember } from './user.interfaces';

export interface VideoElement {
  muted: boolean;
  srcObject: MediaStream;
  member: GroupMember;
}

export interface Message {
  message: string;
  username: string;
}

export interface IncommingMessage extends Message{
    dateTime: Date;
  }