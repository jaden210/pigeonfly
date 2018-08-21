import { Component, OnInit, ViewChild } from '@angular/core';
import { trigger, style, transition, animate } from "@angular/animations";
import { Timeclock, AccountService, Log, User } from '../account.service';
import { map, tap } from 'rxjs/operators';
import * as moment from 'moment';
import { MatDialog } from '@angular/material';
import { MapDialogComponent } from '../map-dialog/map-dialog.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  logs: any;
  oldestLog: any = new Date();
  days = [];

  users = [];

  
  lat: number;
  long: number;

  constructor(
    public accountService: AccountService,
    public dialog: MatDialog
  ) {
    this.accountService.teamUsersObservable.subscribe(teamUsers => {
      if (teamUsers) {
        this.accountService.teamUsers.forEach((user: User) => {
          let userClocks = this.accountService.db.collection("timeclock", ref => ref.where("userId", "==", user.id).orderBy("clockIn", "desc").limit(1));
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
            let status;
            let statusColor;
            if (moment(timeclocks[0].clockIn).diff(moment(), 'days') == 0) {
              if (timeclocks[0].clockOut) {
                status = 'clocked out at: ' + moment(timeclocks[0].clockOut).format('hh:mm a');
                statusColor = "busy";
              } else {
                status = 'active for: ' + 
                moment().diff(moment(timeclocks[0].clockIn), 'hours') + 'h ' +
                moment().diff(moment(timeclocks[0].clockIn), 'minutes') + 'm '; // live timer would happen if this was in HTML
                statusColor = "active";
              }
            } else {
              status = 'last active: ' + moment(timeclocks[0].clockOut).format('MMMM Do YYYY, h:mm:ss a');
              statusColor = "inactive";
            }
            let pushItem = {user, timeclock: timeclocks[0], status, statusColor};
            var foundIndex = this.users.findIndex(x => x.user.id == pushItem.user.id);
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


}