import { Injectable, Component, Inject } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { map, take, debounceTime } from "rxjs/operators";
import {
  MatDialog,
  MatDialogRef,
  MatSnackBar,
  MAT_DIALOG_DATA
} from "@angular/material";
import { AngularFireAuth } from "@angular/fire/auth";
import { Router } from "@angular/router";
import { AngularFireStorage } from "@angular/fire/storage";
import * as moment from "moment";
import { HelperService, Helper } from "./helper.service";

@Injectable({
  providedIn: "root"
})
export class AccountService {
  userObservable: BehaviorSubject<any> = new BehaviorSubject(null);
  user: User = new User();
  aTeamObservable: BehaviorSubject<any> = new BehaviorSubject(null);
  aTeam: Team = new Team();
  teamUsers: User[];
  userTeams: Team[]; // all the teams the user has access to
  teamUsersObservable: BehaviorSubject<any> = new BehaviorSubject(null);
  showHelper: boolean = false;
  showFeedback: boolean = false;
  bShowProfile: boolean = false; // template var
  searchForHelper: string; // template var to assist event system;

  isTrialVersion: boolean = false;
  trialDaysLeft: number;

  helperProfiles = this.helperService.helperProfiles;
  helper: Helper = this.helperProfiles.newTeam;
  feedback: Helper = this.helperProfiles.feedback;

  constructor(
    public db: AngularFirestore,
    private auth: AngularFireAuth,
    public storage: AngularFireStorage,
    public dialog: MatDialog,
    public router: Router,
    public snackbar: MatSnackBar,
    private helperService: HelperService
  ) {}

  setActiveTeam(teamId) {
    if (this.user.teams[teamId] == 0) {
      let dialog = this.dialog.open(NoAccessDialog, {
        disableClose: true
      });
      dialog.afterClosed().subscribe(() => {
        this.logout();
        return;
      });
    }
    let teamDoc = this.db.collection<Team>("team").doc(teamId);
    teamDoc
      .snapshotChanges()
      .pipe(
        map((actions: any) => {
          let data = actions.payload.data();
          data["id"] = actions.payload.id;
          data["createdAt"] = data.createdAt.toDate();
          return data;
        })
      )
      .subscribe(team => {
        if (team.disabled) {
          // the owner deleted the account
          this.showTeamDisabledDialog(team);
          return;
        } else {
          this.aTeam = team;
          this.checkFreeTrial();
          this.aTeamObservable.next(team);
          this.db
            .collection("user", ref => ref.where(`teams.${team.id}`, ">=", 0))
            .snapshotChanges()
            .pipe(
              debounceTime(250), // IDK FIX
              map(actions =>
                actions.map(a => {
                  //better way
                  const data = a.payload.doc.data() as User;
                  const id = a.payload.doc.id;
                  return { id, ...data };
                })
              )
            )
            .subscribe(users => {
              // why is this being hit twice???????
              users.sort((a, b) => a.name.localeCompare(b.name)); // sort
              this.teamUsers = users;
              this.teamUsersObservable.next(users);
            });
        }
      });
  }

  showTeamDisabledDialog(team): void {
    let dialog = this.dialog.open(TeamDisabledDialog, {
      disableClose: true,
      data: {
        isOwner: this.user.id == team.ownerId ? true : false,
        disabledAt: team.disabledAt.toDate(),
        teams: this.userTeams
      }
    });
    dialog.afterClosed().subscribe(data => {
      if (data.reEnable) {
        this.db
          .collection<Team>("team")
          .doc(team.id)
          .update({ disabled: false, disabledAt: null })
          .then(() => {
            window.location.reload(); // easiest way to get new data.
          });
      } else if (data.teamId) {
        this.setActiveTeam(data.teamId);
      } else {
        this.logout();
      }
    });
  }

  checkFreeTrial(): void {
    if (!this.aTeam.cardToken) {
      this.trialDaysLeft =
        30 - moment().diff(this.aTeam.createdAt, "days") < 0
          ? 0
          : 30 - moment().diff(this.aTeam.createdAt, "days");
      this.isTrialVersion = true;
      let snackbar = this.snackbar.open(
        `${this.trialDaysLeft} days left in your free trial`,
        "enter billing info",
        {
          horizontalPosition: "right"
        }
      );
      snackbar.onAction().subscribe(() => {
        this.router.navigate(["account/account"]);
      });
    }
  }

  logout(): void {
    this.auth.auth.signOut().then(() => {
      this.router.navigate(["/login"]);
      window.location.reload();
    });
  }
}

@Component({
  selector: "no-access-dialog",
  templateUrl: "no-access-dialog.html",
  styleUrls: ["./account.component.css"]
})
export class NoAccessDialog {
  constructor(public dialogRef: MatDialogRef<NoAccessDialog>) {}

  close(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: "team-disabled-dialog",
  templateUrl: "team-disabled-dialog.html",
  styleUrls: ["./account.component.css"]
})
export class TeamDisabledDialog {
  count;
  constructor(
    public dialogRef: MatDialogRef<TeamDisabledDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.count = 30 - moment().diff(this.data.disabledAt, "days");
  }

  close(reEnable, teamId?): void {
    this.dialogRef.close({ reEnable, teamId });
  }
}

export class User {
  id?: string;
  uid: string;
  name?: string;
  email: string;
  jobTitle?: string;
  profileUrl?: string;
  username?: string;
  phone?: string;
  accountType?: string;
  teams?: any[];
  isDev: boolean = false;
}

export class Team {
  id: string;
  name: string;
  createdAt: Date;
  ownerId: string;
  logoUrl?: string;
  phone?: string;
  industryId?: string;
  cardToken: any;
  disabled: boolean = false;
  disabledAt: any;
}

export class Log {
  id: string;
  createdAt: Date;
  teamId: string;
  userId: string;
  description: string;
  images: any[] = [];
  surveySubject?: string;
  surveyQuestion?: string;
  LatPos: number;
  LongPos: number;
  updatedId: string;
  updatedBy: string;
  updatedAt: Date;
}

export class Timeclock {
  userId: string;
  shiftStarted: Date = new Date();
  actions: any = {};
  locations: any = {};
  shiftEnded: Date = null;
  secondsWorked: number = 0; // set on shiftEnded
  updatedAt: Date;
  updatedBy: string;
  updatedId: string;
  id?: string;
  loggedHours?: number;
  loggedMinutes?: number;
}

export class InviteToTeam {
  inviteName: string;
  inviteEmail: string;
  companyName: string;
  teamId: string;
  status: string = "invited";
  isAdmin: boolean = false;
  invitedBy: string;
}

export class Event {
  id?: string;
  action: any;
  createdAt: any;
  description: string;
  documentId: string;
  type: string; // survey, survey response, timeclock, log, injury report, supervisor report, self assesment
  userId: string;
}
