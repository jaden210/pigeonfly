import { Component, OnInit, ViewChild, HostListener } from "@angular/core";
import { trigger, style, transition, animate } from "@angular/animations";
import { Timeclock, AccountService, Log, Event } from "../account.service";
import { map, tap } from "rxjs/operators";
import * as moment from "moment";
import { MatDialog } from "@angular/material";
import { ImagesDialogComponent } from "../images-dialog/images-dialog.component";
import { Observable } from "rxjs";

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

  constructor(public accountService: AccountService, public dialog: MatDialog) {
    this.accountService.helper = this.accountService.helperProfiles.log;
    this.accountService.aTeamObservable.subscribe(aTeam => {
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
          .limit(1)
          )
      } else {
        return (   
          ref
          .where("teamId", "==", this.accountService.aTeam.id)
          .orderBy("createdAt", "desc")
          .limit(5)
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

  getEventDetails(event) {
    if (event.details) {
      event.bShowDetails = true;
    } else {
      let doc = this.accountService.db
        .collection(event.type)
        .doc(event.documentId);
      doc.valueChanges().subscribe((details: any) => {
        details.clockIn ? (details.clockIn = details.clockIn.toDate()) : null;
        details.clockOut
          ? (details.clockOut = details.clockOut.toDate())
          : null;
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
    let lm = parseInt(duration.asMinutes()) % 60;
    return lh + "h " + lm + "m";
  }

  showImages(images) {
    let dialog = this.dialog.open(ImagesDialogComponent, {
      data: images
    });
  }

  export() {}
}
