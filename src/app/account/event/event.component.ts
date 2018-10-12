import { Component, OnInit, ViewChild } from '@angular/core';
import { trigger, style, transition, animate } from "@angular/animations";
import { Timeclock, AccountService, Log, Event } from '../account.service';
import { map, tap } from 'rxjs/operators';
import * as moment from 'moment';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.css'],
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
export class EventComponent {

  searchStr; // template variable
  filterUsers; // template variable

  events: any;
  oldestEvent: any = new Date();
  days = [];

  
  lat: number;
  long: number;

  constructor(
    public accountService: AccountService
  ) {
    this.accountService.helper = this.accountService.helperProfiles.log;
    this.accountService.aTeamObservable.subscribe(aTeam => {
      if (aTeam) {
        let eventCollection = this.accountService.db.collection("event", ref => ref.where("teamId", "==", this.accountService.aTeam.id))
        eventCollection.snapshotChanges().pipe(
          map(actions => {
            return actions.map(a => {
              let data:any = a.payload.doc.data();
              return <Event>{
                ...data,
                id: a.payload.doc.id,
                createdAt: data["createdAt"].toDate()
              };
            });
          }),
          tap(results => {
            results.sort((a, b) => {
              return a.createdAt < b.createdAt ? 1 : -1;
            });
          })
        ).subscribe(events => {
          if (events.length == 0) this.accountService.showHelper = true;
          this.events = events;
          this.events.forEach(event => {
            if (this.oldestEvent > event.createdAt) {
              this.oldestEvent = event.createdAt;
            }
            event.user = this.accountService.teamUsers.find(user => user.id == event.userId);
          });
          this.buildCalendar();
        }); 
      }
    });
  }

  buildCalendar() {
    this.days = [];
    let now: any = new Date();
    let total_days = Math.round((now - this.oldestEvent) / (1000 * 60 * 60 * 24)); //moment equilivant?
    for (let i = 0; i <= total_days; i++) {
      let date = moment().subtract(i, 'days');
      let month = date.format('MMM');
      let day = date.format('DD');
      let dOW = date.format('ddd');
      let events = this.getEventsByDate(date); 
      this.days.push({id: i + 1, date, month, day, dOW, events: events.events});
    }
  }

  getEventsByDate(date) {
    let eventsOnDate: Event[] = this.events.filter(event => moment(event.createdAt).isSame(date, 'day'));
    return { events: eventsOnDate };
  }

  getEventDetails(event) {
    if (event.details) {
      event.bShowDetails = true;
    } else {
      let doc = this.accountService.db.collection(event.type).doc(event.documentId);
      doc.valueChanges().subscribe((details: any) => {
        details.clockIn ? details.clockIn = details.clockIn.toDate() : null;
        details.clockOut ? details.clockOut = details.clockOut.toDate() : null;
        event.details = details;
        event.bShowDetails = true;
      });
    }
  }

  getDiff(time) {
    let ci = moment(time.clockIn);
    let co = moment(time.clockOut);
    let duration: any = moment.duration(co.diff(ci));
    let lh = parseInt(duration.asHours());
    let lm = parseInt(duration.asMinutes())%60;
    return lh + 'h ' + lm + 'm';
  }

  export() {
    
  }

}