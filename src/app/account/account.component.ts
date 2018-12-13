import { Component, Inject } from '@angular/core';
import { trigger, style, transition, animate } from "@angular/animations";
import { AccountService, User, Team, InviteToTeam } from './account.service';
import { AngularFireAuth } from '@angular/fire/auth';
import { map } from "rxjs/operators";
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material';
import { AppService } from '../app.service';
declare var gtag: Function;

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
  animations: [
    trigger("helper", [
      transition(":enter", [
        style({ transform: "translateX(-150%)", opacity: 0 }),
        animate("400ms ease-out", style({ transform: "translateX(0)", opacity: 1 }))
      ]),
      transition(":leave", [
        style({ transform: "translateX(0)", opacity: 1 }),
        animate("400ms ease-in", style({ transform: "translateX(-150%)", opacity: 0 }))
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
        let userDoc = this.accountService.db.collection("user").doc(user.uid)
        userDoc.snapshotChanges().pipe(
          map((actions:any) => {
            let data = actions.payload.data();
            data['id'] = actions.payload.id;
            return data;
          })
        ).subscribe((user: User) => {
          if (user.id) {
            this.accountService.userObservable.next(user);
            this.accountService.user = user;
            let invitedCollection = this.accountService.db.collection("invitation", ref => ref.where("status", "==", "invited").where("inviteEmail", "==", user.email.toLowerCase()));
            invitedCollection.snapshotChanges().pipe(
              map((actions:any)=> actions.map(a => {
                const data = a.payload.doc.data() as InviteToTeam;
                const id = a.payload.doc.id;
                return { id, ...data };
              }))
              ).subscribe(invitations => {
                invitations = invitations;
                if (invitations.length > 0) { // add them to their teams
                  invitations.forEach((team: any) => {
                    user.teams[team.teamId] = team.isAdmin ? 1 : 0; // should probably document this so it isn't confusing
                    this.accountService.db.collection("invitation").doc(team.id).delete();
                  });
                  this.accountService.checkStripePlan();
                  this.accountService.db.collection("user").doc(user.id).update({...user}).then(() => this.selectTeam());
                } else this.selectTeam();
              });
            }
        });
        if (this.appService.removeFromInvite) {
          this.appService.removeFromInvite = false;
          invitations.forEach(invitation => {
            this.accountService.db.collection("invitation").doc(invitation.id).delete();
          });
        }
      } else this.accountService.logout();
    });
  }
  
  selectTeam() {
    this.accountService.userTeams = [];
    Object.keys(this.accountService.user.teams).forEach(key => {
      let teamDoc = this.accountService.db.collection("team").doc(key)
      teamDoc.valueChanges().subscribe((team: Team) => {
        team.id = key;
        this.accountService.userTeams.push(team);
      });
    });
    if (this.appService.firstTimeUser) {
      this.appService.firstTimeUser = false;
      this.welcomeDialog();
    }
    this.accountService.setActiveTeam(Object.keys(this.accountService.user.teams)[0]);
  }

  welcomeDialog() {
    let dialog = this.dialog.open(WelcomeDialog, {
      disableClose: true,
      width: '750px',
      data: {
        name: this.accountService.user.name,
        businessName: null,
        industryId: null
      }
    });
    dialog.afterClosed().subscribe(data => {
      this.createCompletedAchievement(this.accountService.aTeam.id);
      this.accountService.user.name = data.name;
      this.accountService.db.collection("user").doc(this.accountService.user.id).update({...this.accountService.user});
      this.accountService.aTeam.name = data.businessName;
      this.accountService.aTeam.industryId = data.industryId;
      this.accountService.db.collection("team").doc(this.accountService.aTeam.id).update({...this.accountService.aTeam});
      this.router.navigate(['/account/achievements']);
      gtag("event", "account_created", {
        event_category: "info added",
        event_label: "info was added to the account"
      });
    });
  }

  createCompletedAchievement(teamId) { // TODO: make this an interface that the cloud function can access
    this.accountService.db.collection("completed-achievement").add({
      teamId: teamId,
      hasCompanyLogo: false,
      hasOwnerProfileUrl: false,
      hasBillingInfo: false,
      logsCount: 0,
      timeclocksCount: 0,
      invitedUsers: 0,
      likedTrainingContent: 0,
      startedTrainings: 0,
      startedSelfAssesments: 0,
      completedSelfAssesments: 0,
      injuryReports: 0,
      trainingSurveyResponseCount: 0,
      isInviteEntireTeam: null,
      customTrainingArticleCount: 0,
      isAllSelfInspections: null,
      isTeamSubmitInjuryReport: null,
      isTeamCreateLogs: null,
      isTrainingDashboardComplete: null,
      isCurrentOnSelfInspections: null,
      isCorrectedSelfInspections: null,
      isAccidentsReported: null,
      isAccidentVisible: null,
      isInvitesCurrent: null,
      hasContactInfo: null,
      isPosterDisplayed: null,
      isEquipmentProvided: null,
      isAppDownload: null,
      isSelectTrainingContent: null
    });
  }

  closeHelper() {
    this.accountService.showHelper = false;
  }

  submitFeedback() {
    let fbtext = JSON.parse(JSON.stringify(this.accountService.helperProfiles.feedback));
    this.accountService.feedback.name = "Thanks for your feedback!"
    setTimeout(() => {
      this.accountService.showFeedback = false;
      this.accountService.db.collection("feedback").add({
        origin: 'feeback helper',
        originPage: location.pathname,
        description: this.accountService.feedback.description,
        userId: this.accountService.user.id,
        userName: this.accountService.user.name,
        teamName: this.accountService.aTeam.name,
        email: this.accountService.user.email,
        isClosed: false,
        createdAt: new Date()
      }).then(() => {
        this.accountService.feedback = fbtext;
        this.accountService.feedback.description = '';
      });
    }, 2000);
  }
}

@Component({
  selector: 'welcome-dialog',
  templateUrl: 'welcome-dialog.html',
  styleUrls: ['./account.component.css']
})
export class WelcomeDialog {

  industries;

  constructor(
    public dialogRef: MatDialogRef<WelcomeDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any, public accountService: AccountService) {
      let accountTypesCollection = this.accountService.db.collection("industry"); //thinking this will never be a large call, but check with nested collections to see later.
      accountTypesCollection.snapshotChanges().pipe(
        map((actions:any) => actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return { id, ...data };
        }))
      ).subscribe(industries => {
        this.industries = industries;
      });
    }

  close(): void {
    this.dialogRef.close(this.data);
  }

}