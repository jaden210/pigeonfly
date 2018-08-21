import { Component, OnInit, ViewChild } from '@angular/core';
import { trigger, style, transition, animate } from "@angular/animations";
import { Timeclock, AccountService, Log } from '../account.service';
import { map, tap } from 'rxjs/operators';
import * as moment from 'moment';

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.css'],
  animations: [
    trigger("expand", [
      transition("void => *", [
        style({ height: 0}),
        animate("400ms ease-in-out", style({ }))
      ]),
      transition("* => void", [
        style({ }),
        animate("400ms ease-in-out", style({ height: 0 }))
      ])
    ])
  ]
})
export class LogComponent {

  searchStr; // template variable
  filterUsers; // template variable

  logs: any;
  oldestLog: any = new Date();
  days = [];

  
  lat: number;
  long: number;

  constructor(
    public accountService: AccountService
  ) {
    this.accountService.aTeamObservable.subscribe(aTeam => {
      if (aTeam) {
        let logCollection = this.accountService.db.collection("log", ref => ref.where("teamId", "==", this.accountService.aTeam.id))
        logCollection.snapshotChanges().pipe(
          map(actions => {
            return actions.map(a => {
              let data:any = a.payload.doc.data();
              return <Log>{
                ...data,
                id: a.payload.doc.id,
                createdAt: data["createdAt"].toDate()
              };
            });
          }),
          tap(results => {
            results.sort((a, b) => {
              return a.createdAt < b.createdAt ? -1 : 1;
            });
          })
        ).subscribe(logs => {
          this.logs = logs;
          this.logs.forEach(log => {
            if (this.oldestLog > log.createdAt) {
              this.oldestLog = log.createdAt;
            }
            log.user = this.accountService.teamUsers.find(user => user.id == log.userId);
            if (!this.lat && log.LatPos) { // gives scope to the google map plugin
              this.lat = log.LatPos;
              this.long = log.LongPos;
            }
          });
          this.buildCalendar();
        }); 
      }
    });
  }

  buildCalendar() {
    this.days = [];
    let now: any = new Date();
    let total_days = Math.round((now - this.oldestLog) / (1000 * 60 * 60 * 24)); //moment equilivant?
    for (let i = 0; i <= total_days; i++) {
      let date = moment().subtract(i, 'days');
      let month = date.format('MMM');
      let day = date.format('DD');
      let dOW = date.format('dddd');
      let logs = this.getLogsByDate(date); 
      this.days.push({id: i, date, month, day, dOW, logs: logs.logs, loggers: logs.loggers});
    }
  }

  getLogsByDate(date) {
    let users = [];
    let logsOnDate: Log[] = this.logs.filter(log => moment(log.createdAt).isSame(date, 'day'));
    logsOnDate.forEach((day: Log) => {
      if (!users.find(user => user.id == day.userId)) {
        users.push(this.accountService.teamUsers.find(user => user.id == day.userId));
      }
    });
    return { logs:logsOnDate, loggers: users };
  }

  export() {
    
  }

}