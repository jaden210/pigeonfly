import { Injectable } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  isUser: boolean = false; // decides if a user has logged in before
  isLoggedIn: boolean = false; // decides if a user is logged in
  firstTimeUser: boolean = false; // lets the system show new member dialog

  removeFromInvite: boolean = false;
  toolbarShadow: boolean = true;

  constructor(
    public db: AngularFirestore
  ) { }
  
}

export class User { // also in account service
  id?: string;
  name?: string;
  email: string;
  profileUrl?: string;
  username?: string;
  phone?: string;
  accountType?: string;
  teams?: any[]; 
}



/*
to push a tag:

declare var gtag: Function;


gtag("event", "video_watched", {
      event_category: "video",
      event_label: "video"
    });
*/