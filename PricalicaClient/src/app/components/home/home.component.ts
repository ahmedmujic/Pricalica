import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Peer from 'peerjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  username!: string;
  roomId: string = "";

  constructor(private router: Router) { }

  ngOnInit() {

  }

  navigateToRoom(){
    let queryParamObject: any = {};

    queryParamObject['username'] = this.username;
    if(this.roomId){
      queryParamObject['id'] = this.roomId;
    }

    this.router.navigate(['room'], {queryParams: queryParamObject})
  }

}
