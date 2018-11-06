import { Injectable } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
import { MatDialog } from '@angular/material';
import { VideoDialogComponent } from './video-dialog/video-dialog.component';
declare var gtag: Function;

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
    public db: AngularFirestore,
    public dialog: MatDialog
  ) { }

  watchVideo() {
    let dialog = this.dialog.open(VideoDialogComponent);
    gtag("event", "video_watched", {
      event_category: "video",
      event_label: "video"
    });
  }
  
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