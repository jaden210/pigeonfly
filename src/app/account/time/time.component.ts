import { Component, OnInit, ViewChild } from '@angular/core';
import { trigger, style, transition, animate } from "@angular/animations";
import { Timeclock, AccountService } from '../account.service';
import { map, tap } from 'rxjs/operators';
import * as moment from 'moment';


@Component({
  selector: 'app-time',
  templateUrl: './time.component.html',
  styleUrls: ['./time.component.css'],
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
export class TimeComponent {

  searchStr; // template variable
  filterUsers; // template variable


  timeClocks: any;
  oldestLog: any = new Date();
  days = [];

  
  lat: number;
  long: number;

  constructor(
    public accountService: AccountService
  ) {
    this.accountService.helper = this.accountService.helperProfiles.time;
    this.accountService.aTeamObservable.subscribe(aTeam => {
      if (aTeam) {
        let timeCollection = this.accountService.db.collection("timeclock", ref => ref.where("teamId", "==", this.accountService.aTeam.id).where("clockOut", "<=", new Date()))
        timeCollection.snapshotChanges().pipe(
          map(actions => {
            return actions.map(a => {
              let data:any = a.payload.doc.data();
              return <Timeclock>{
                ...data,
                id: a.payload.doc.id,
                clockIn: data["clockIn"].toDate(),
                clockOut: data["clockOut"].toDate()
              };
            });
          }),
          tap(results => {
            results.sort((a, b) => {
              return a.clockIn < b.clockIn ? -1 : 1;
            });
          })
        ).subscribe(timeClocks => {
          if (timeClocks.length == 0) this.accountService.showHelper = true;
          this.timeClocks = timeClocks;
          this.timeClocks.forEach(timeClock => {
            if (this.oldestLog > timeClock.clockIn) {
              this.oldestLog = timeClock.clockIn;
            }
            timeClock.user = this.accountService.teamUsers.find(user => user.id == timeClock.userId);
            if (!this.lat && timeClock.inLatPos) { // gives scope to the google map plugin
              this.lat = timeClock.inLatPos;
              this.long = timeClock.inLongPos;
            }
          });
          this.buildCalendar();
        }); 
      }
    });
  }

  buildCalendar() {
    let now: any = new Date();
    let total_days = Math.round((now - this.oldestLog) / (1000 * 60 * 60 * 24)); //moment equilivant?
    for (let i = 0; i <= total_days; i++) {
      let date = moment().subtract(i, 'days');
      let month = date.format('MMM');
      let day = date.format('DD');
      let dOW = date.format('ddd');
      let timeClocks = this.getClocksByDate(date); 
      this.days.push({id: i, date, month, day, dOW, loggedHours: timeClocks.loggedHours, loggedMinutes: timeClocks.loggedMinutes, timeLogs: timeClocks.logs, loggers: timeClocks.loggers});
    }
  }

  getClocksByDate(date) {
    let loggedHours = 0;
    let loggedMinutes = 0;
    let users = [];
    let timeClocksOnDate: Timeclock[] = this.timeClocks.filter(day => moment(day.clockIn).isSame(date, 'day'));
    timeClocksOnDate.forEach((day: Timeclock) => {
      loggedHours = loggedHours + day.loggedHours;
      loggedMinutes = loggedMinutes + day.loggedMinutes;
      if(loggedMinutes > 60) {
        loggedMinutes = loggedMinutes - 60;
        loggedHours = loggedHours + 1;
      }
      if (!users.find(user => user.id == day.userId)) {
        users.push(this.accountService.teamUsers.find(user => user.id == day.userId));
      }
    });
    return {loggedHours, loggedMinutes, logs:timeClocksOnDate, loggers: users};
  }

  export() {
    
  }

}
