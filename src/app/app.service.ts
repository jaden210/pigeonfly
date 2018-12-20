import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { MatDialog } from "@angular/material";
import { VideoDialogComponent } from "./video-dialog/video-dialog.component";
import { AngularFireAuth } from "@angular/fire/auth";
import { Router } from "@angular/router";
import { Observable } from "rxjs";
import { map, tap } from "rxjs/operators";
declare var gtag: Function;

@Injectable({
  providedIn: "root"
})
export class AppService {
  /* Set on sign-up-page */
  email: string;
  /* Checking for invites sets this here */
  invites: any[];

  isUser: boolean = false; // decides if a user has logged in before
  isLoggedIn: boolean = false; // decides if a user is logged in
  firstTimeUser: boolean = false; // lets the system show new member dialog

  removeFromInvite: boolean = false;
  toolbarShadow: boolean = true;

  constructor(
    public db: AngularFirestore,
    public dialog: MatDialog,
    private auth: AngularFireAuth,
    private router: Router
  ) {}

  watchVideo() {
    let dialog = this.dialog.open(VideoDialogComponent);
    gtag("event", "video_watched", {
      event_category: "video",
      event_label: "video"
    });
  }

  /* When they put in their email address check it first */
  checkForExistingUser(email): Promise<boolean> {
    return (
      this.auth.auth
        .fetchSignInMethodsForEmail(email)
        /* If length > 0, not new else new user */
        .then(
          data => {
            return data.length ? true : false;
          },
          error => {
            throw error;
          }
        )
    );
  }

  /* From the create account button, if all clear route to get started */
  getInvites(email): Observable<any> {
    return this.db
      .collection("invitation", ref =>
        ref.where("inviteEmail", "==", email.toLowerCase())
      )
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { ...data, id };
          })
        ),
        tap(invites => (this.invites = invites))
      );
  }
}

export class User {
  // also in account service
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
