import { Injectable } from "@angular/core";
import { AngularFirestore } from "angularfire2/firestore";
import { Observable, BehaviorSubject } from "rxjs";
import { map, tap, groupBy, flatMap, toArray, switchMap } from "rxjs/operators";
import { of, combineLatest } from "rxjs";
import { DatePipe } from "@angular/common";
import { Timeclock, AccountService } from "../account.service";
import * as moment from "moment";

@Injectable()
export class TimeService {
  private _loading = new BehaviorSubject(false);
  private todaysDatePiped: string = this.datePipe.transform(
    new Date(),
    "MMM d"
  );
  private workers: any[] = [];
  public loading: Observable<boolean> = this._loading.asObservable();
  public lastLoadLength: number;

  constructor(
    private afs: AngularFirestore,
    private datePipe: DatePipe,
    private accountService: AccountService
  ) {}

  public getTimeLogs(
    teamId: string,
    startDate: Date,
    endDate: Date
  ): Observable<any> {
    this._loading.next(true);
    return this.afs
      .collection("timeclock", ref => {
        return (
          ref
            .where("teamId", "==", teamId)
            .where("clockOut", ">=", startDate)
            // .where("clockOut", "<=", endDate)
            .orderBy("clockOut", "desc")
        );
      })
      .snapshotChanges()
      .pipe(
        map(logs => {
          return logs.map(log => {
            let data: any = log.payload.doc.data();
            let user = this.getEmployee(data.userId);
            let clockIn: Date = data.clockIn.toDate();
            let clockOut: Date = data.clockOut.toDate();
            return <any>{
              ...data,
              querySelectorId: log.payload.doc.id.replace(/[0-9]/g, ""),
              id: log.payload.doc.id,
              clockIn,
              clockOut,
              user
            };
          });
        }),
        tap(() => {
          setTimeout(() => this._loading.next(false), 350);
        })
      );
  }

  private getEmployee(userId): any {
    return this.accountService.teamUsers.find(user => user.id == userId);
  }
}
