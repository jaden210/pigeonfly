import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { AccountService, Log } from "../account.service";

@Injectable()
export class LogService {

  limit: number = 50;

  constructor(private accountService: AccountService) {}

  public getLogs(): Observable<any> {
    return this.accountService.db
      .collection(`team/${this.accountService.aTeam.id}/log`, ref => ref.orderBy("createdAt", "desc").limit(this.limit))
      .snapshotChanges()
      .pipe(
        map(actions => {
          return actions.map(a => {
            let data: any = a.payload.doc.data();
            return <Log>{
              ...data,
              id: a.payload.doc.id,
              createdAt: data["createdAt"].toDate(),
              updatedAt: data["updatedAt"] ? data["updatedAt"].toDate() : null
            };
          });
        })
      );
  }
  
}
