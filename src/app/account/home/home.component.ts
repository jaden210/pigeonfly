import { Component, Inject } from '@angular/core';
import { Timeclock, AccountService, Log, User, InviteToTeam } from '../account.service';
import { map } from 'rxjs/operators';
import * as moment from 'moment';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MapDialogComponent } from '../map-dialog/map-dialog.component';
import { Observable } from 'rxjs';
declare var gtag: Function;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  invitedUsers: Observable<InviteToTeam[]>;
  logs: any;
  oldestLog: any = new Date();
  days = [];
  users;

  constructor(
    public accountService: AccountService,
    public dialog: MatDialog
  ) {
    this.accountService.helper = this.accountService.helperProfiles.team;
    this.accountService.teamUsersObservable.subscribe(teamUsers => {
      if (teamUsers) {
        let invitedCollection = this.accountService.db.collection<InviteToTeam[]>("invitation", ref => ref.where("status", "==", "invited").where("teamId", "==", this.accountService.aTeam.id));
        this.invitedUsers = invitedCollection.snapshotChanges().pipe(
          map(actions => {
            return actions.map(a => {
              let data:any = a.payload.doc.data();
              return <InviteToTeam>{
                ...data,
                id: a.payload.doc.id,
              };
            });
          })
        );
        this.users = [];
        this.accountService.teamUsers.forEach((user: User) => {
          let userClocks = this.accountService.db.collection("timeclock", ref => ref
            .where("userId", "==", user.id)
            .where("teamId", "==", this.accountService.aTeam.id)
            .orderBy("clockIn", "desc").limit(1));
          userClocks.snapshotChanges().pipe(
            map(actions => {
              return actions.map(a => {
                let data:any = a.payload.doc.data();
                let clockOut = data['clockOut'] ? data['clockOut'].toDate() : null;
                return <Timeclock>{
                  ...data,
                  id: a.payload.doc.id,
                  clockIn: data["clockIn"].toDate(),
                  clockOut
                };
              });
            })
          ).subscribe(timeclocks => {
            let pushItem;
            let foundIndex;
            if (timeclocks.length > 0) {
              let status;
              let statusColor;
              if (moment(timeclocks[0].clockIn).diff(moment(), 'days') == 0) {
                if (timeclocks[0].clockOut) {
                  status = 'clocked out at: ' + moment(timeclocks[0].clockOut).format('hh:mm a');
                  statusColor = "busy";
                } else {
                  let ci = moment(timeclocks[0].clockIn);
                  let co = moment();
                  let duration: any = moment.duration(co.diff(ci));
                  status = 'active for: ' + 
                  parseInt(duration.asHours()) + 'h ' +
                  parseInt(duration.asMinutes()) % 60 + 'm '; // live timer would happen if this was in HTML
                  statusColor = "active";
                }
              } else {
                status = 'last active: ' + moment(timeclocks[0].clockOut).format('MMMM Do YYYY, h:mm:ss a');
                statusColor = "inactive";
              }
              pushItem = {user, timeclock: timeclocks[0], status, statusColor};
              foundIndex = this.users.findIndex(x => x.user.id == pushItem.user.id);
            } else {
              pushItem = {user, timeclock: null, status:"new member", statusColor:"inactive"};
              foundIndex = this.users.findIndex(x => x.user.id == pushItem.user.id);
            }
            if (foundIndex >= 0) {
              this.users[foundIndex] = pushItem;
            } else {
              this.users.push(pushItem);
            }
          });
        })
      }
    });
  }
    
  showMap(user) {
    let dialog = this.dialog.open(MapDialogComponent, {
      data: {
        longPos: user.timeclock.outLongPos || user.timeclock.inLongPos,
        latPos: user.timeclock.outLatPos || user.timeclock.inLatPos
      }
    })
  }

  inviteToTeam() {
    let dialog = this.dialog.open(InviteDialog, {
      data: new InviteToTeam(),
      disableClose: true
    });
    dialog.afterClosed().subscribe((data: InviteToTeam) => {
      if (data) {
        data.companyName = this.accountService.aTeam.name;
        data.teamId = this.accountService.aTeam.id;
        this.accountService.db.collection("invitation").add({... data});
        gtag("event", "user_invited", {
          event_category: "user Invited",
          event_label: "a new user has been invited to a team"
        });
      }
    });
  }

  editUser(user) {
    let dUser = user.user;
    dUser.isAdmin = user.user.teams[this.accountService.aTeam.id] == 1 ? true : false;
    let dialog = this.dialog.open(EditUserDialog, {
      data: user.user,
      disableClose: true
    });
    dialog.afterClosed().subscribe((data: any) => {
      if (data) {
        data.email = data.email.toLowerCase();
        data.isAdmin ? data.teams[this.accountService.aTeam.id] = 1 : data.teams[this.accountService.aTeam.id] = 0;
        this.accountService.db.collection("user").doc(data.id).update({... data}).then(() => {
          // throw a toast or something maybe?
        });
      }
    });
  }

  deleteInvite(user) {
    this.accountService.db.collection("invitation").doc(user.id).delete();
  }
}

@Component({
  selector: 'invite-dialog',
  templateUrl: 'invite-dialog.html',
  styleUrls: ['./home.component.css']
})
export class InviteDialog {

  constructor(
    public dialogRef: MatDialogRef<InviteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: InviteToTeam) {}

  close(): void {
    this.dialogRef.close();
  }

}

@Component({
  selector: 'edit-user-dialog',
  templateUrl: 'user-dialog.html',
  styleUrls: ['./home.component.css']
})
export class EditUserDialog {

  constructor(
    public dialogRef: MatDialogRef<EditUserDialog>,
    public accountService: AccountService,
    @Inject(MAT_DIALOG_DATA) public data: User) {}

  close(): void {
    this.dialogRef.close();
  }

}