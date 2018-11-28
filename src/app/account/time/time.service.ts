import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable, BehaviorSubject } from "rxjs";
import { map, tap, groupBy, flatMap, toArray, switchMap, take } from "rxjs/operators";
import { of, combineLatest } from "rxjs";
import { DatePipe } from "@angular/common";
import { Timeclock, AccountService } from "../account.service";
import * as moment from "moment";

@Injectable()
export class TimeService {

  limit: number = 50;

  constructor(
    private afs: AngularFirestore,
    private datePipe: DatePipe,
    private accountService: AccountService
  ) {}

  public getTimeLogs(): Observable<any> {
      return this.afs.collection(`team/${this.accountService.aTeam.id}/timeclock`, ref => 
      ref.where("clockOut", "<=", new Date())
        .orderBy("clockOut", "desc")
        .limit(this.limit)
      )
      .snapshotChanges()
      .pipe(
        map(logs => {
          return logs.map(log => {
            let data: any = log.payload.doc.data();
            let user = this.getEmployee(data.userId);
            let clockIn: Date = data.clockIn.toDate();
            let clockOut: Date = data.clockOut.toDate();
            let updatedAt = data.updatedAt ? data.updatedAt.toDate() : null;
            return <any>{
              ...data,
              querySelectorId: log.payload.doc.id.replace(/[0-9]/g, ""),
              id: log.payload.doc.id,
              clockIn,
              clockOut,
              updatedAt,
              user
            };
          });
        })
      );
  }

  private getEmployee(userId): any {
    return this.accountService.teamUsers.find(user => user.id == userId);
  }
}
