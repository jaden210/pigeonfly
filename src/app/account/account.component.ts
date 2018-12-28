import { Component, Inject } from "@angular/core";
import { trigger, style, transition, animate } from "@angular/animations";
import { AccountService, User, Team, InviteToTeam } from "./account.service";
import { AngularFireAuth } from "@angular/fire/auth";
import { map, take } from "rxjs/operators";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material";
import { AppService } from "../app.service";
import { forkJoin } from "rxjs";

@Component({
  selector: "app-account",
  templateUrl: "./account.component.html",
  styleUrls: ["./account.component.css"],
  animations: [
    trigger("helper", [
      transition(":enter", [
        style({ transform: "translateX(-150%)", opacity: 0 }),
        animate(
          "400ms ease-out",
          style({ transform: "translateX(0)", opacity: 1 })
        )
      ]),
      transition(":leave", [
        style({ transform: "translateX(0)", opacity: 1 }),
        animate(
          "400ms ease-in",
          style({ transform: "translateX(-150%)", opacity: 0 })
        )
      ])
    ])
  ]
})
export class AccountComponent {
  bShowAccountInfo: boolean = false; // template var
  helperContrast: boolean = false; // template var

  constructor(
    public accountService: AccountService,
    public appService: AppService,
    private auth: AngularFireAuth,
    public router: Router,
    public dialog: MatDialog
  ) {
    this.auth.auth.onAuthStateChanged(user => {
      let invitations;
      if (user && user.uid) {
        let userDoc = this.accountService.db.collection("user").doc(user.uid);
        userDoc
          .snapshotChanges()
          .pipe(
            map((actions: any) => {
              let data = actions.payload.data() || {};
              data["id"] = actions.payload.id;
              return data;
            })
          )
          .subscribe((user: User) => {
            if (user.id) {
              this.accountService.userObservable.next(user);
              this.accountService.user = user;
              let invitedCollection = this.accountService.db.collection(
                "invitation",
                ref =>
                  ref
                    .where("status", "==", "invited")
                    .where("inviteEmail", "==", user.email.toLowerCase())
              );
              invitedCollection
                .snapshotChanges()
                .pipe(
                  map((actions: any) =>
                    actions.map(a => {
                      const data = a.payload.doc.data() as InviteToTeam;
                      const id = a.payload.doc.id;
                      return { id, ...data };
                    })
                  )
                )
                .subscribe(invitations => {
                  invitations = invitations;
                  if (invitations.length > 0) {
                    // add them to their teams
                    invitations.forEach((team: any) => {
                      user.teams[team.teamId] = team.isAdmin ? 1 : 0; // should probably document this so it isn't confusing
                      this.accountService.db
                        .collection("invitation")
                        .doc(team.id)
                        .delete();
                    });
                    this.accountService.checkStripePlan();
                    this.accountService.db
                      .collection("user")
                      .doc(user.id)
                      .update({ ...user })
                      .then(() => this.selectTeam());
                  } else this.selectTeam();
                });
            }
          });
        if (this.appService.removeFromInvite) {
          this.appService.removeFromInvite = false;
          invitations.forEach(invitation => {
            this.accountService.db
              .collection("invitation")
              .doc(invitation.id)
              .delete();
          });
        }
      } else this.accountService.logout();
    });
  }

  selectTeam() {
    this.accountService.userTeams = [];
    forkJoin(
      Object.keys(this.accountService.user.teams).map(key => {
        return this.accountService.db
          .collection("team")
          .doc(key)
          .valueChanges()
          .pipe(
            take(1),
            map((team: Team) => {
              team.id = key;
              this.accountService.userTeams.push(team);
              return team;
            })
          );
      })
    ).subscribe(teams => {
      this.accountService.setActiveTeam(teams[0].id);
    });
  }

  closeHelper() {
    this.accountService.showHelper = false;
  }

  submitFeedback() {
    let fbtext = JSON.parse(
      JSON.stringify(this.accountService.helperProfiles.feedback)
    );
    this.accountService.feedback.name = "Thanks for your feedback!";
    setTimeout(() => {
      this.accountService.showFeedback = false;
      this.accountService.db
        .collection("feedback")
        .add({
          origin: "feeback helper",
          originPage: location.pathname,
          description: this.accountService.feedback.description,
          userId: this.accountService.user.id,
          userName: this.accountService.user.name,
          teamName: this.accountService.aTeam.name,
          email: this.accountService.user.email,
          isClosed: false,
          createdAt: new Date()
        })
        .then(() => {
          this.accountService.feedback = fbtext;
          this.accountService.feedback.description = "";
        });
    }, 2000);
  }
}
