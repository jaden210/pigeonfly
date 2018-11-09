import { Component, OnInit, ViewChild, HostListener , Inject} from '@angular/core';
import { trigger, style, transition, animate } from "@angular/animations";
import { Timeclock, AccountService, Log, Event } from "../account.service";
import { map, tap } from "rxjs/operators";
import * as moment from "moment";
import { MatDialog } from "@angular/material";
import { ImagesDialogComponent } from "../images-dialog/images-dialog.component";
import { Observable } from "rxjs";
import { Router } from '@angular/router';

@Component({
  selector: "app-event",
  templateUrl: "./event.component.html",
  styleUrls: ["./event.component.css"],
  animations: [
    trigger("expand", [
      transition("void => *", [
        style({ height: 0 }),
        animate("400ms ease-in-out", style({}))
      ]),
      transition("* => void", [
        style({}),
        animate("400ms ease-in-out", style({ height: 0 }))
      ])
    ])
  ]
})
export class EventComponent {
  searchStr; // template variable
  filterUsers; // template variable
  filterTypes; // template variable

  events: any = [];
  eventTypes;
  days = [];

  lastLog; // for pagination

  now: any = moment().format('MMM');

  constructor(public accountService: AccountService, public dialog: MatDialog, public router: Router) {
    this.accountService.helper = this.accountService.helperProfiles.event;
    this.accountService.teamUsersObservable.subscribe(aTeam => {
      if (aTeam) {
        this.getLogs();
      }
    });
  }

  getLogs() {
    this.getEvents().subscribe(events => {
      if (events.length == 0 && !this.lastLog) {
        this.accountService.showHelper = true;
        return;
      };
      if (events.length == 0) return;
      this.events = this.events.concat(events);
      this.lastLog = events[events.length - 1];
      this.eventTypes = [];
      this.events.forEach(event => {
        event.user = this.accountService.teamUsers.find(user => user.id == event.userId);
        if (!this.eventTypes.find(type => type == event.type)) this.eventTypes.push(event.type);
      });
        this.buildCalendar();
        this.onScroll();
      });  
  }

  public getEvents(): Observable<any> {
    return this.accountService.db.collection("event", ref => {
      if (!this.lastLog) {
        return (
          ref
          .where("teamId", "==", this.accountService.aTeam.id)
          .orderBy("createdAt", "desc")
          .limit(50)
          )
      } else {
        return (   
          ref
          .where("teamId", "==", this.accountService.aTeam.id)
          .orderBy("createdAt", "desc")
          .limit(50)
          .startAfter(this.lastLog.createdAt)
          );
        }
      })
      .snapshotChanges().pipe(
        map(actions => {
          return actions.map(a => {
            let data:any = a.payload.doc.data();
            return <Event>{
              ...data,
              id: a.payload.doc.id,
              createdAt: data["createdAt"].toDate()
            };
          });
        })
      )
  }

  @HostListener('scroll', ['$event'])
  onScroll(event?: any) {
    if (!event) {
      if (document.getElementById('body').clientHeight < document.getElementById('window').clientHeight) this.getLogs(); // if there isn't enough results to pass the fold, load more
      return;
    }
    if (event.target.offsetHeight + event.target.scrollTop >= event.target.scrollHeight) {
      this.getLogs();
    }
  }
  
  buildCalendar() {
    this.days = [];
    let now: any = new Date();
    let total_days = moment(now).diff(this.events[this.events.length -1].createdAt, 'days');
    for (let i = 0; i <= total_days; i++) {
      let date = moment().subtract(i, "days");
      let month = date.format("MMM");
      let day = date.format("DD");
      let dOW = date.format("ddd");
      let events = this.getEventsByDate(date);
      this.days.push({
        id: i + 1,
        date,
        month,
        day,
        dOW,
        events: events.events
      });
    }
  }

  getEventsByDate(date) {
    let eventsOnDate: Event[] = this.events.filter(event =>
      moment(event.createdAt).isSame(date, "day")
    );
    return { events: eventsOnDate };
  }

  routeToEventOrigin(event: Event) {
    switch (event.type) {
      case EventType.log:
      this.accountService.searchForHelper = event.documentId;
      this.router.navigate(['account/log']);
      return;
      case EventType.timeclock:
      this.accountService.searchForHelper = event.documentId;
      this.router.navigate(['account/time']);
      return;
      case EventType.member:
      this.accountService.searchForHelper = event.documentId;
      this.router.navigate(['account/dashboard']);
      return;
      case EventType.incidentReport:
      this.router.navigate(['account/incident-reports']);
      return;
      case EventType.selfInspection:
      this.router.navigate(['account/self-inspection']);
      return;
      case EventType.survey:
      this.router.navigate(['account/surveys/' + event.documentId]);
      return;
      case EventType.surveyResponse:
      this.router.navigate(['account/surveys/' + event.documentId]);
      return;
    }
  }
}

enum EventType {
  log = 'Log',
  timeclock = "Timeclock",
  incidentReport = "Incident Report",
  survey = "Survey",
  surveyResponse = "Survey Response",
  selfInspection = "Self Inspection",
  training = "Training",
  member = "Member"
}