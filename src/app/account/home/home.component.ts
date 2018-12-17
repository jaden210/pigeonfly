import { Component, Inject, ViewChild, OnDestroy } from "@angular/core";
import { AccountService, User, InviteToTeam } from "../account.service";
import { map, finalize } from "rxjs/operators";
import * as moment from "moment";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatTable
} from "@angular/material";
import { MapDialogComponent } from "../map-dialog/map-dialog.component";
import { Observable, Subscription, forkJoin } from "rxjs";
import { HomeService } from "./home.service";
import { SelfInspection } from "../self-inspections/self-inspections.service";
import { AngularFireStorage } from "@angular/fire/storage";
import { TrainingService, MyContent } from "../training/training.service";
import { Router } from "@angular/router";
declare var gtag: Function;

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
  providers: [TrainingService]
})
export class HomeComponent implements OnDestroy {
  private subscription: Subscription;
  invitedUsers: InviteToTeam[];
  files: Observable<any>;
  users = [];
  activeUsers = []; // really just used for length
  @ViewChild(MatTable) table: MatTable<any>;
  displayedColumns: string[] = [
    "profile",
    "name",
    "status",
    "training",
    "location"
  ];

  selfInspection;
  achievements;
  completedCount: number;
  complianceLevel: number;

  constructor(
    public accountService: AccountService,
    public dialog: MatDialog,
    private homeService: HomeService,
    private trainingService: TrainingService,
    private router: Router
  ) {
    this.accountService.helper = this.accountService.helperProfiles.team;
    this.subscription = this.accountService.teamUsersObservable.subscribe(
      teamUsers => {
        if (teamUsers) {
          if (teamUsers.length == 1) this.accountService.showHelper = true;
          this.homeService
            .getInvites()
            .subscribe(users => (this.invitedUsers = users));
          this.homeService.getAchievements().subscribe(achievements => {
            this.achievements = achievements[0];
            this.getComplianceLevel();
          });
          this.getSelfInspectionStats();
          this.files = this.homeService.getFiles();
          this.buildUsers();
        }
      }
    );
  }

  private buildUsers(): void {
    let users = this.accountService.teamUsers;
    const teamId = this.accountService.aTeam.id;
    forkJoin(
      forkJoin(
        users.map(user =>
          this.homeService.getUserTimeclocks(user.id).pipe(
            map(tc => {
              const shift = tc[0] || null;
              return { ...user, shift };
            })
          )
        )
      ),
      this.trainingService.getMyContent(teamId)
    ).subscribe(data => {
      let [team, myContent] = data;
      this.setMetrics(myContent);
      this.users = team.map(tm => {
        const srt = myContent.filter(mc =>
          Object.keys(mc.shouldReceiveTraining).includes(tm.id)
        );
        const nt = srt.filter(mc => mc.needsTraining.includes(tm.id));
        let status = "Clocked-Out";
        let location = {};
        if (tm.shift) {
          if (!tm.shift.shiftEnded) {
            status = "Clocked-In";
            if (this.activeUsers.findIndex(user => user.id == tm.id) > -1) {
              delete this.activeUsers[this.activeUsers.findIndex(user => user.id == tm.id)];
            } else {
              this.activeUsers.push(tm.id);
            }
          };
          let events = tm.shift.events || [];
          for (let e of events) {
            if (!e.in) status = e.type == "lunch" ? "At Lunch" : "On Break";
          }
          let locations = Object.keys(tm.shift.locations || {}).sort();
          if (locations.length) location = locations[0];
        }
        return { ...tm, srt, nt, status, location };
      });
    });
  }

  public trainingComplete: number;
  public needsTraining: string[];
  public trainingsGiven: number;
  private setMetrics(myContent: MyContent[]): void {
    let totalTrainings = 0;
    let compliantTrainings = 0;
    let needsTraining = {};
    let trainingsGiven = 0;
    myContent.forEach(mc => {
      const srt = Object.keys(mc.shouldReceiveTraining).length;
      const nt = mc.needsTraining.length;
      totalTrainings += srt;
      compliantTrainings += srt - nt;
      mc.needsTraining.forEach(id => {
        needsTraining[id] = 1;
      });
      if (nt < srt) trainingsGiven += 1;
    });
    this.trainingsGiven = trainingsGiven;
    this.needsTraining = Object.keys(needsTraining);
    this.trainingComplete =
      Math.floor(compliantTrainings / totalTrainings) * 100;
  }

  public routeToIndividualCompliance(userId: string) {
    const srt = JSON.stringify([userId]);
    this.router.navigate(["account/training/my-content"], {
      queryParams: { srt }
    });
  }

  public routeToTrainingDashboard(): void {
    this.router.navigate(["account", "training", "dashboard"]);
  }

  public showMap(location: { lat: number; long: number }): void {
    this.dialog.open(MapDialogComponent, {
      data: {
        longPos: location.long,
        latPos: location.lat
      }
    });
  }

  viewInvites(action: string) {
    let dialog = this.dialog.open(InviteDialog, {
      data: {
        view: action || "pending",
        invites: this.invitedUsers,
        invite: new InviteToTeam()
      },
      disableClose: true
    });
    dialog.afterClosed().subscribe((data: any) => {
      if (data) {
        if (data.invite) {
          // invite to team
          this.accountService.db
            .collection("user", ref =>
              ref.where("email", "==", data.invite.inviteEmail)
            )
            .valueChanges()
            .subscribe((users: User[]) => {
              // can only ever be 1 in a bugless world
              if (users.length) {
                // this guy is in the system, lets just add him to the team now
                users[0].teams[this.accountService.aTeam.id] = data.invite
                  .isAdmin
                  ? 1
                  : 0;
                this.accountService.db
                  .doc(`user/${users[0].id}`)
                  .update({ teams: users[0].teams });
              } else {
                // new to the system
                data.invite.companyName = this.accountService.aTeam.name;
                data.invite.teamId = this.accountService.aTeam.id;
                data.invite.invitedBy = this.accountService.user.id;
                this.accountService.db
                  .collection("invitation")
                  .add({ ...data.invite });
              }
            });
          gtag("event", "user_invited", {
            event_category: "user Invited",
            event_label: "a new user has been invited to a team"
          });
        }
      }
    });
  }

  openTeamFilesDialog() {
    this.dialog.open(TeamFilesDialog);
  }

  editUser(user) {
    let dialog = this.dialog.open(EditUserDialog, {
      data: user,
      disableClose: true
    });
    dialog.afterClosed().subscribe((data: any) => {
      if (data) {
        data.isAdmin
          ? (data.teams[this.accountService.aTeam.id] = 1)
          : (data.teams[this.accountService.aTeam.id] = 0);
        if (data.removeFromTeam) {
          delete data.teams[this.accountService.aTeam.id];
        }
        this.accountService.db
          .doc(`user/${data.id}`)
          .update({ ...data })
          .then(() => {
            // throw a toast or something maybe?
            this.accountService.checkStripePlan(); // could alter the team payment plan
          });
      }
    });
  }

  getSelfInspectionStats(): void {
    this.selfInspection = { expired: 0, current: 0 };
    this.homeService.getSelfInspections().subscribe(selfInspections => {
      selfInspections.forEach((inspection: SelfInspection) => {
        if (inspection.inspectionExpiration) {
          switch (inspection.inspectionExpiration) {
            case "Anually":
              this.setSelfInspectionCount(inspection, "years");
              return;
            case "Semi-Anually":
              this.setSelfInspectionCount(inspection, "months", 6);
              return;
            case "Quarterly":
              this.setSelfInspectionCount(inspection, "months", 3);
              return;
            case "Monthly":
              this.setSelfInspectionCount(inspection, "month");
              return;
          }
        } else this.selfInspection.current++;
      });
    });
  }

  setSelfInspectionCount(
    inspection: SelfInspection,
    unitOfTime,
    compare?
  ): void {
    if (
      moment(inspection.lastCompletedAt).diff(
        inspection.createdAt,
        unitOfTime
      ) > compare ||
      0
    ) {
      this.selfInspection.expired++;
    } else this.selfInspection.current++;
  }

  getComplianceLevel(): void {
    this.homeService.getSystemAchievements().subscribe(results => {
      this.completedCount = 0;
      this.complianceLevel = 0;
      results.forEach(level => {
        level.completedAchievementsCount = 0;
        level.possibleAchievementsCount = 0;
        level.checkpoints.forEach(checkpoint => {
          checkpoint.achievements.forEach(achievement => {
            achievement.progress = this.achievements[achievement.key] || 0;
            level.possibleAchievementsCount =
              level.possibleAchievementsCount + 1;
            if (
              Object.prototype.toString.call(achievement.progress) ===
              "[object Object]"
            ) {
              // this covers the badges users have to complete
              let date = moment(achievement.progress.toDate());
              if (moment().diff(date, "days") <= achievement.completedValue) {
                level.completedAchievementsCount =
                  level.completedAchievementsCount + 1;
                this.completedCount = this.completedCount + 1;
              }
            } else if (
              achievement.progress >= achievement.completedValue ||
              achievement.progress == true
            ) {
              //already achieved
              level.completedAchievementsCount =
                level.completedAchievementsCount + 1;
              this.completedCount = this.completedCount + 1;
            }
          });
        });
        if (level.completedAchievementsCount == level.possibleAchievementsCount)
          this.complianceLevel = this.complianceLevel + 1;
      });
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}

@Component({
  selector: "invite-dialog",
  templateUrl: "invite-dialog.html",
  styleUrls: ["./home.component.css"]
})
export class InviteDialog {
  constructor(
    public dialogRef: MatDialogRef<InviteDialog>,
    private homeService: HomeService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  deleteInvite(inviteId) {
    this.homeService.deleteInvite(inviteId).then(() => {
      this.data.invites.splice(this.data.invites.indexOf(inviteId), 1);
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: "edit-user-dialog",
  templateUrl: "user-dialog.html",
  styleUrls: ["./home.component.css"]
})
export class EditUserDialog {
  constructor(
    public dialogRef: MatDialogRef<EditUserDialog>,
    public accountService: AccountService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.data.removeFromTeam = false;
  }

  close(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: "team-files-dialog",
  templateUrl: "team-files-dialog.html",
  styleUrls: ["./home.component.css"]
})
export class TeamFilesDialog {
  files: File[];
  aFile: File = new File();
  loading: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<EditUserDialog>,
    public accountService: AccountService,
    private storage: AngularFireStorage,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.accountService.db
      .collection(`team/${this.accountService.aTeam.id}/file`)
      .snapshotChanges()
      .pipe(
        map((actions: any) =>
          actions.map(a => {
            const data = a.payload.doc.data() as File;
            data["createdAt"] = data.createdAt.toDate();
            const id = a.payload.doc.id;
            return { id, ...data };
          })
        )
      )
      .subscribe(files => {
        this.files = files;
        if (files.length) this.aFile = files[0];
      });
  }

  upload(): void {
    // this will call the file input from our custom button
    document.getElementById("upFile").click();
  }

  uploadFile(event) {
    this.loading = true;
    let uFile = event.target.files[0];
    let filePath = `${this.accountService.aTeam.id}/files/${new Date()}`;
    let ref = this.storage.ref(filePath);
    let task = this.storage.upload(filePath, uFile);
    task
      .snapshotChanges()
      .pipe(
        finalize(() => {
          ref.getDownloadURL().subscribe(url => {
            let file = new File();
            file.createdAt = new Date();
            file.uploadedBy = this.accountService.user.id;
            file.fileUrl = url;
            file.name = uFile.name;
            file.type = uFile.type;
            this.accountService.db
              .collection(`team/${this.accountService.aTeam.id}/file`)
              .add({ ...file })
              .then(snapshot => {
                this.loading = false;
                file.id = snapshot.id;
                this.aFile = file;
              });
          });
        })
      )
      .subscribe();
  }

  save() {
    this.accountService.db
      .doc(`team/${this.accountService.aTeam.id}/file/${this.aFile.id}`)
      .update({ ...this.aFile });
  }

  delete() {
    const index = this.files.indexOf(this.aFile);
    this.accountService.db
      .doc(`team/${this.accountService.aTeam.id}/file/${this.aFile.id}`)
      .delete()
      .then(() => (this.aFile = this.files[index - 1 < 0 ? 0 : index - 1]));
  }

  download() {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.onload = event => {
      /* Create a new Blob object using the response
       *  data of the onload object.
       */
      const blob = new Blob([xhr.response], { type: this.aFile.type });
      const a: any = document.createElement("a");
      a.style = "display: none";
      document.body.appendChild(a);
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = this.aFile.name;
      a.click();
      window.URL.revokeObjectURL(url);
    };
    xhr.open("GET", this.aFile.fileUrl);
    xhr.send();
  }

  close(): void {
    this.dialogRef.close();
  }
}

export class File {
  id?: string;
  fileUrl: string;
  name: string;
  createdAt: any;
  uploadedBy: string;
  isPublic: boolean = false;
  type?: string;
}
