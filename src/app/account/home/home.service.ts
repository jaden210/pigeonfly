import { Injectable, Component } from "@angular/core";
import { Observable } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { map, tap, take, mergeMap } from "rxjs/operators";
import { AccountService, InviteToTeam } from "../account.service";
import { MatDialogRef } from "@angular/material";
import { SelfInspection } from "../self-inspections/self-inspections.service";
import { Timeclock } from "../time/time.service";

@Injectable({
  providedIn: "root"
})
export class HomeService {
  constructor(
    public db: AngularFirestore,
    private accountService: AccountService
  ) {}

  getInvites(): Observable<InviteToTeam[]> {
    let invitedCollection = this.accountService.db.collection<InviteToTeam[]>(
      "invitation",
      ref =>
        ref
          .where("status", "==", "invited")
          .where("teamId", "==", this.accountService.aTeam.id)
    );
    return invitedCollection.snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          let data: any = a.payload.doc.data();
          return <InviteToTeam>{
            ...data,
            id: a.payload.doc.id
          };
        });
      })
    );
  }

  getSelfInspections(): Observable<SelfInspection[]> {
    return this.db
      .collection(`team/${this.accountService.aTeam.id}/self-inspection`)
      .snapshotChanges()
      .pipe(
        map(actions => {
          return actions.map(a => {
            let data = a.payload.doc.data() as SelfInspection;
            data["id"] = a.payload.doc.id;
            data["createdAt"] = data.createdAt.toDate();
            data["lastCompletedAt"] = data.lastCompletedAt
              ? data.lastCompletedAt.toDate()
              : null;
            return { ...data };
          });
        })
      );
  }

  getFiles() {
    return this.db
      .collection(`team/${this.accountService.aTeam.id}/file`)
      .valueChanges();
  }

  getAchievements(): Observable<any> {
    return this.db
      .collection("completed-achievement", ref =>
        ref.where("teamId", "==", this.accountService.aTeam.id)
      )
      .valueChanges();
  }

  getSystemAchievements(): Observable<any> {
    return this.accountService.db
      .collection("achievement", ref => ref.orderBy("level"))
      .valueChanges();
  }

  getUserTimeclocks(userId) {
    let userClocks = this.accountService.db.collection(
      `team/${this.accountService.aTeam.id}/timeclock`,
      ref =>
        ref
          .where("userId", "==", userId)
          .orderBy("shiftStarted", "desc")
          .limit(1)
    );
    return userClocks.snapshotChanges().pipe(
      take(1),
      map(actions => {
        return actions.map(a => {
          let data: any = a.payload.doc.data();
          let shiftEnded = data["shiftEnded"]
            ? data["shiftEnded"].toDate()
            : null;
          return <Timeclock>{
            ...data,
            id: a.payload.doc.id,
            shiftStarted: data["shiftStarted"].toDate(),
            shiftEnded
          };
        });
      })
    );
  }

  deleteInvite(id): Promise<any> {
    return this.accountService.db.doc(`invitation/${id}`).delete();
  }
}
