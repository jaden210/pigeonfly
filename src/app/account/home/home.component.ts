import { Component, Inject, ViewChild, OnDestroy } from "@angular/core";
import {
  Timeclock,
  AccountService,
  Log,
  User,
  InviteToTeam
} from "../account.service";
import { map, finalize } from "rxjs/operators";
import * as moment from "moment";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatTableDataSource, MatTable } from "@angular/material";
import { MapDialogComponent } from "../map-dialog/map-dialog.component";
import { Observable, Subscription } from "rxjs";
import { HomeService } from "./home.service";
import { SelfInspection } from "../self-inspections/self-inspections.service";
import { AngularFireStorage } from "@angular/fire/storage";
declare var gtag: Function;

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"]
})
export class HomeComponent implements OnDestroy {
  
  private subscription: Subscription;
  invitedUsers: InviteToTeam[];
  files: Observable<any>;
  users = [];
  activeUsers = []; // really just used for length
  @ViewChild(MatTable) table: MatTable<any>;
  displayedColumns: string[] = ["profile","name","status","training","location"];

  selfInspection;
  achievements;
  completedCount: number;
  complianceLevel: number;

  constructor(public accountService: AccountService, public dialog: MatDialog, private homeService: HomeService) {
    this.accountService.helper = this.accountService.helperProfiles.team;
    this.subscription = this.accountService.teamUsersObservable.subscribe(teamUsers => {
      if (teamUsers) {
        if (teamUsers.length == 1) this.accountService.showHelper = true;
        this.homeService.getInvites().subscribe(users => this.invitedUsers = users);;
        this.homeService.getAchievements().subscribe(achievements => {
          this.achievements = achievements[0];
          this.getComplianceLevel();
        });
        this.getSelfInspectionStats();
        this.files = this.homeService.getFiles();
        this.buildUsers();
      }
    });
  }

  buildUsers(): void {
    this.accountService.teamUsers.forEach((user: User) => {
      this.homeService.getUserTimeclocks(user).subscribe(timeclocks => { // only ever 1
          let status;
          let statusColor;
          let active = false;
          if (timeclocks.length > 0) { // they have worked before
            if (moment(timeclocks[0].shiftStarted).isSame(moment(), "day")) { // last worked within a day
              if (timeclocks[0].shiftEnded) { // done working
                status = "shift ended at: " + moment(timeclocks[0].shiftEnded).format("hh:mm a");
                statusColor = "busy";
              } else { // still working
                active = true;
                let clockIn = moment(timeclocks[0].shiftStarted);
                let duration: any = moment.duration(moment().diff(clockIn));
                status = "active for: " +
                  parseInt(duration.asHours()) +
                  "h " +
                  (parseInt(duration.asMinutes()) % 60) +
                  "m "; // live timer would happen if this was in HTML
                statusColor = "active";
              }
            } else { // havent worked in a while
              status = "last active: " + moment(timeclocks[0].shiftEnded).format("MMMM Do YYYY, h:mm:ss a");
              statusColor = "inactive";
            }
          }
          let userInfo = {
            user,
            timeclock: timeclocks[0] || null,
            status: status || "new member",
            statusColor: statusColor || "inactive"
          }
          this.addUserToUsers(userInfo, active);
        });
    });
  }
  
  addUserToUsers(addUser, active: boolean): void {
    let foundUserIndex = this.users.findIndex(user => user.user.id == addUser.user.id);
    if (foundUserIndex > -1) {
      this.users[foundUserIndex] = addUser;
    } else {
      this.users.push(addUser);
    }
    this.table.renderRows();
    if (active) { // could be better way
      let foundActiveIndex = this.activeUsers.findIndex(user => user.user.id == addUser.user.id);
      if (foundActiveIndex > -1) {
        delete this.activeUsers[foundActiveIndex];
      } else {
        this.activeUsers.push(addUser);
      }
    }
  }

  showMap(user) {
    let smar = Object.keys(user.timeclock.locations).sort();
    let location = user.timeclock.locations[smar[0]];
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
        if (data.invite) { // invite to team
          this.accountService.db.collection("user", ref => ref.where("email", "==", data.invite.inviteEmail))
          .valueChanges()
          .subscribe((users: User[]) => { // can only ever be 1 in a bugless world
            if (users.length) { // this guy is in the system, lets just add him to the team now
              users[0].teams[this.accountService.aTeam.id] = data.invite.isAdmin ? 1 : 0;
              this.accountService.db.doc(`user/${users[0].id}`).update({teams: users[0].teams});
            } else { // new to the system
              data.invite.companyName = this.accountService.aTeam.name;
              data.invite.teamId = this.accountService.aTeam.id;
              data.invite.invitedBy = this.accountService.user.id;
              this.accountService.db.collection("invitation").add({ ...data.invite });
            }
          })
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
    let dUser = user.user;
    dUser.isAdmin =
      user.user.teams[this.accountService.aTeam.id] == 1 ? true : false;
    let dialog = this.dialog.open(EditUserDialog, {
      data: user.user,
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
    this.selfInspection = {expired: 0, current: 0};
    this.homeService.getSelfInspections().subscribe(selfInspections => {
      selfInspections.forEach((inspection:SelfInspection) => {
        if (inspection.inspectionExpiration) {
          switch (inspection.inspectionExpiration) {
            case "Anually":
            this.setSelfInspectionCount(inspection, 'years');
            return;
            case "Semi-Anually":
            this.setSelfInspectionCount(inspection, 'months', 6);
            return;
            case "Quarterly":
            this.setSelfInspectionCount(inspection, 'months', 3);
            return;
            case "Monthly":
            this.setSelfInspectionCount(inspection, 'month');
            return;
          }
        } else this.selfInspection.current ++;
      })
    })
  }

  setSelfInspectionCount(inspection: SelfInspection, unitOfTime, compare?): void {
    if (moment(inspection.lastCompletedAt).diff(inspection.createdAt, unitOfTime) > compare || 0) {
      this.selfInspection.expired ++;
    } else this.selfInspection.current ++;
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
            level.possibleAchievementsCount = level.possibleAchievementsCount + 1;
            if (Object.prototype.toString.call(achievement.progress) === "[object Object]") { // this covers the badges users have to complete
              let date = moment(achievement.progress.toDate());
              if (moment().diff(date, 'days') <= achievement.completedValue) {
                level.completedAchievementsCount = level.completedAchievementsCount + 1;
                this.completedCount = this.completedCount + 1;
              }
            } else if (achievement.progress >= achievement.completedValue || achievement.progress == true) { //already achieved
              level.completedAchievementsCount = level.completedAchievementsCount + 1;
              this.completedCount = this.completedCount + 1;
            }
          });
        });
        if (level.completedAchievementsCount == level.possibleAchievementsCount) this.complianceLevel = this.complianceLevel + 1;
      })
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
      this.data.invites.splice(this.data.invites.indexOf(inviteId),1);
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
    this.accountService.db.collection(`team/${this.accountService.aTeam.id}/file`).snapshotChanges().pipe(
      map((actions: any) =>
          actions.map(a => {
            const data = a.payload.doc.data() as File;
            data['createdAt'] = data.createdAt.toDate();
            const id = a.payload.doc.id;
            return { id, ...data };
          })
        )
    ).subscribe(files => {this.files = files; this.aFile = files[0]});
  }

  upload(): void { // this will call the file input from our custom button
    document.getElementById('upFile').click();
  }

  uploadFile(event) {
    this.loading = true;
    let uFile = event.target.files[0];
    let filePath = `${this.accountService.aTeam.id}/files/${new Date()}`;
    let ref = this.storage.ref(filePath);
    let task = this.storage.upload(filePath, uFile);
    task.snapshotChanges().pipe(
      finalize(() => {
        ref.getDownloadURL().subscribe(url => {
          let file = new File();
          file.createdAt = new Date();
          file.uploadedBy = this.accountService.user.id;
          file.fileUrl = url;
          file.name = uFile.name
          file.type = uFile.type;
          this.accountService.db.collection(`team/${this.accountService.aTeam.id}/file`).add({...file}).then(snapshot => {
            this.loading = false;
            file.id = snapshot.id;
            this.aFile = file;
          });
        });
      })
    ).subscribe();
  }

  save() {
    this.accountService.db.doc(`team/${this.accountService.aTeam.id}/file/${this.aFile.id}`).update({...this.aFile});
  }
  
  delete() {
    const index = this.files.indexOf(this.aFile);
    this.accountService.db.doc(`team/${this.accountService.aTeam.id}/file/${this.aFile.id}`).delete().then(() => this.aFile = this.files[index]);
  }

  download() {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = (event) => {
      /* Create a new Blob object using the response
      *  data of the onload object.
      */
      const blob = new Blob([xhr.response], { type: this.aFile.type });
      const a: any = document.createElement('a');
      a.style = 'display: none';
      document.body.appendChild(a);
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = this.aFile.name;
      a.click();
      window.URL.revokeObjectURL(url);
    };
    xhr.open('GET', this.aFile.fileUrl);
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