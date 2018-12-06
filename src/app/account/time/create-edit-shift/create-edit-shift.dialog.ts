import { Component, Inject, OnInit } from "@angular/core";
import { AccountService, User } from "../../account.service";
import { TimeService, Timeclock } from "../time.service";
import { DatePipe } from "@angular/common";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";

@Component({
  templateUrl: "create-edit-shift.dialog.html",
  styleUrls: ["create-edit-shift.dialog.css"]
})
export class CreateEditShiftDialog implements OnInit {
  user: User;
  shiftStarted: InOutTime;
  shiftEnded: InOutTime;
  events: TEvent[] = [];
  lastEventTime: Date;
  error: string;
  template: boolean;
  loading: boolean;

  constructor(
    private dialogRef: MatDialogRef<CreateEditShiftDialog>,
    @Inject(MAT_DIALOG_DATA) private shift: Timeclock,
    private accountService: AccountService,
    private timeService: TimeService,
    private date: DatePipe
  ) {}

  ngOnInit() {
    this.user = this.accountService.teamUsers.find(
      u => u.id == this.shift.userId
    );
    this.shiftStarted = new InOutTime(
      this.date.transform(this.shift.shiftStarted, "shortTime"),
      this.shift.shiftStarted
    );
    this.shiftEnded = new InOutTime(
      this.date.transform(this.shift.shiftEnded, "shortTime"),
      this.shift.shiftEnded
    );
    this.events = this.shift.events
      .sort((a, b) => (a.out < b.out ? -1 : 1))
      .map(event => {
        const inTime = event.in
            ? this.date.transform(event.in, "shortTime")
            : null,
          outTime = event.out
            ? this.date.transform(event.out, "shortTime")
            : null,
          inT = new InOutTime(inTime, event.in),
          outT = new InOutTime(outTime, event.out),
          type = event.type;
        this.lastEventTime = event.out;
        return { inT, outT, type };
      });
    this.template = true;
  }

  /* Called from drag and drop on events, reorders events. This is
  just to put the user at ease, the list is sorted before persisted */
  public drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.events, event.previousIndex, event.currentIndex);
  }

  /* Users for employee dropdown */
  public get Users(): User[] {
    return this.accountService.teamUsers;
  }

  /* Sets the max date on date inputs so the user cannot exceed the 
  shift start date by more than 1 day */
  public get MaxDate(): Date {
    return new Date(this.shiftStarted.date.getTime() + 24 * 60 * 60 * 1000);
  }

  /* If the start date and end date of the shift are not equal, then I
  need to show the date input on the events, else hide it */
  public get DatesNotEqual(): boolean {
    if (this.shiftStarted.date && this.shiftEnded.date) {
      return this.shiftStarted.date.getDate() < this.shiftEnded.date.getDate();
    }
    return false;
  }

  /* Called on keyup of any time input, sets the valid flag on the time 
  object. If valid, sets the date-time for that input */
  public checkValidity(time: InOutTime): void {
    const regEx = /((1[0-2]|0?[1-9]):([0-5][0-9]) ?([AaPp][Mm]))/;
    const valid = regEx.test(time.timeValue);
    if (valid) {
      this.parseTime(time);
    }
    /* Forces change detection on template */
    setTimeout(() => (time.valid = valid), 0);
  }

  /* The time string is parsed into a valid date if the string is valid
  according to the regex in the checkValidity function. */
  private parseTime(time: InOutTime): void {
    if (!time) return;
    let date = time.date || new Date(this.shiftStarted.date);
    var parts = time.timeValue.match(/(\d+):(\d+) ([AaPp][Mm])/);
    let hours = parseInt(parts[1]) || 0,
      minutes = parseInt(parts[2]) || 0,
      tt = parts[3].toLowerCase();
    if (tt == "am" && hours == 12) hours = 0;
    if (tt === "pm" && hours < 12) hours += 12;
    date.setHours(hours, minutes, 0, 0);
    time.date = date;
  }

  public removeEvent(event: TEvent): void {
    let i = this.events.indexOf(event);
    this.events.splice(i, 1);
  }

  public deleteShift() {
    this.timeService
      .deleteShift(this.shift.id, this.accountService.aTeam.id)
      .then(() => this.dialogRef.close());
  }

  public newEvent(type: string): void {
    let time = this.date.transform(this.lastEventTime, "shortTime");
    const inT = new InOutTime(time, this.lastEventTime);
    const outT = new InOutTime(time, this.lastEventTime);
    this.events.push({ inT, outT, type });
  }

  /* The shift wont save if there is an error in the events */
  private checkIfEventsValid(): string {
    let eventsError;
    const shiftStarted = this.shiftStarted.date.getTime();
    const shiftEnded = this.shiftEnded.date.getTime();
    for (let e of this.events) {
      const inT = e.inT.date ? e.inT.date.getTime() : null;
      const outT = e.outT.date ? e.outT.date.getTime() : null;
      eventsError =
        !inT || !outT
          ? "Date required on one or more events"
          : inT < outT
          ? "Event time out of order, in type cannot come before an out type"
          : inT < shiftStarted || outT < shiftStarted
          ? "Events cannot happen before the shift starts"
          : inT > shiftEnded || outT > shiftEnded
          ? "Events cannot happen after the shift ends"
          : null;
      /* check if this event overlaps another event */
      for (let ev of this.events) {
        if (ev !== e) {
          const inT2 = ev.inT.date ? new Date(ev.inT.date).getTime() : null;
          const outT2 = ev.outT.date ? new Date(ev.outT.date).getTime() : null;
          if (!inT2 || !outT2) {
            eventsError = "Date required on one or more events";
            break;
          }
          if ((outT > outT2 && outT < inT2) || (inT < inT2 && inT < outT2)) {
            eventsError = "One or more events overlap";
            break;
          }
        }
      }
      if (eventsError) break;
    }
    return eventsError;
  }

  public save(): void {
    this.error = !this.shiftStarted.date
      ? "Shift Started required"
      : !this.shiftEnded.date
      ? "Shift Ended required"
      : this.shiftStarted.date.getTime() > this.shiftEnded.date.getTime()
      ? "Shift Started must be before Shift Ended"
      : this.checkIfEventsValid();
    if (!this.error) {
      this.loading = true;
      this.setFieldsOnShift();
      if (this.shift.id) {
        this.timeService
          .updateShift(this.shift, this.accountService.aTeam.id)
          .then(
            () => this.dialogRef.close(this.shift),
            error => {
              this.error = "Error updating shift. " + JSON.stringify(error);
              this.loading = false;
            }
          );
      } else {
        this.timeService
          .createShift(this.shift, this.accountService.aTeam.id)
          .then(() => {
            this.dialogRef.close(),
              error => {
                this.error = "Error creating shift. " + JSON.stringify(error);
                this.loading = false;
              };
          });
      }
    }
  }

  private setFieldsOnShift(): void {
    this.shift.shiftStarted = this.shiftStarted.date;
    this.shift.shiftEnded = this.shiftEnded.date;
    this.shift.userId = this.user.id;
    this.shift.updatedAt = new Date();
    this.shift.updatedBy = this.accountService.user.name;
    this.shift.updatedId = this.accountService.user.id;
    this.shift.events = this.events
      .sort((a, b) => (a.outT < b.outT ? -1 : 1))
      .map(e => {
        return {
          in: e.inT.date,
          out: e.outT.date,
          type: e.type
        };
      });
    this.timeService.setSecondsWorked(this.shift);
  }
}

class TEvent {
  inT: InOutTime;
  outT: InOutTime;
  type: string;
}

class InOutTime {
  constructor(public timeValue: string, public date: Date) {}
  valid: boolean = true;
}
