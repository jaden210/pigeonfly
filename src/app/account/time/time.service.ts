import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import * as moment from "moment";

@Injectable()
export class TimeService {
  constructor(public db: AngularFirestore) {}

  public getTimeclocks(
    teamId,
    startDate: Date,
    endDate: Date
  ): Observable<Timeclock[]> {
    return this.db
      .collection(`team/${teamId}/timeclock`, ref =>
        ref
          .where("shiftStarted", ">=", startDate)
          .where("shiftStarted", "<=", endDate)
          .orderBy("shiftStarted", "desc")
      )
      .snapshotChanges()
      .pipe(
        map(actions => {
          return actions.map(a => {
            const data: any = a.payload.doc.data();
            const events = data.events
              ? data.events.map(e => {
                  const inT = e.in ? e.in.toDate() : null;
                  const out = e.out.toDate();
                  const type = e.type;
                  return { in: inT, out, type };
                })
              : [];
            return <Timeclock>{
              ...data,
              events,
              id: a.payload.doc.id,
              shiftStarted: data.shiftStarted.toDate(),
              shiftEnded: data.shiftEnded ? data.shiftEnded.toDate() : null,
              updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
              loggedMinutes: Math.ceil((data.secondsWorked % 3600) / 60),
              loggedHours: Math.floor(data.secondsWorked / 3600)
            };
          });
        })
      );
  }

  public updateShift(shift: Timeclock, teamId): Promise<void> {
    this.setSecondsWorked(shift);
    const id = shift.id;
    let shiftCopy: Timeclock = JSON.parse(JSON.stringify(shift));
    delete shiftCopy.id;
    delete shiftCopy.loggedHours;
    delete shiftCopy.loggedMinutes;
    return this.db
      .collection(`team/${teamId}/timeclock`)
      .doc(id)
      .update({ ...shift })
      .catch(e => {
        console.error(e);
        throw e;
      });
  }

  public createShift(shift: Timeclock, teamId): Promise<string> {
    this.setSecondsWorked(shift);
    return this.db
      .collection(`team/${teamId}/timeclock`)
      .add({ ...shift })
      .then(snapshot => {
        return snapshot.id;
      });
  }

  public deleteShift(shiftId, teamId): Promise<void> {
    return this.db
      .collection(`team/${teamId}/timeclock`)
      .doc(shiftId)
      .delete();
  }

  /* returns most recent clock in, if no clock out follows it. Also sets the
  seconds worked on the timeclock before a save or to init the currenct clock */
  public setSecondsWorked(shift: Timeclock): number {
    let shiftStarted = moment(shift.shiftStarted);
    let shiftEnded = shift.shiftEnded ? moment(shift.shiftEnded) : moment();
    let secondsWorked = shiftEnded.diff(shiftStarted, "seconds");
    shift.events.forEach(event => {
      if (event.out) {
        let inTime = event.in ? moment(event.in) : moment();
        let secondsOff = inTime.diff(moment(event.out), "seconds") || 0;
        secondsWorked -= secondsOff;
      }
    });
    shift.secondsWorked = secondsWorked || 0;
    return secondsWorked || 0;
  }
}

export class Timeclock {
  userId: string;
  shiftStarted: Date = new Date();
  events: Event[] = [];
  locations: {} = {};
  shiftEnded: Date = null;
  secondsWorked: number = 0; // set on shiftEnded
  updatedAt: Date;
  updatedBy: string;
  updatedId: string;
  id?: string;
  loggedMinutes?: number;
  loggedHours?: number;
}

export class Event {
  type: string; // break, lunch
  in: Date = null;
  out: Date;
}
