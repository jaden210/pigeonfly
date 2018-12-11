import { Component, OnInit, Inject } from '@angular/core';
import { AccountService } from '../account.service';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import * as moment from "moment";
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Timestamp } from 'rxjs/internal/operators/timestamp';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.css']
})
export class AchievementsComponent implements OnInit {

  complianceLevel: number;
  completedCount: number;
  levels = [];
  completedAchievementsDocId;
 
  constructor(public accountService: AccountService, public router: Router, public dialog: MatDialog) { }

  ngOnInit() {
    this.accountService.helper = this.accountService.helperProfiles.achievement;
    this.accountService.teamUsersObservable.subscribe(users => {
      if (users) {
        combineLatest(this.getAchievements(), this.getCompletedAchievements()).subscribe(results => {
          this.completedCount = 0;
          this.complianceLevel = 0;
          this.levels = results[0];
          this.completedAchievementsDocId =  results[1][0].id;
          results[0].forEach(level => {
            level.completedAchievementsCount = 0;
            level.possibleAchievementsCount = 0;
            level.checkpoints.forEach(checkpoint => {
              checkpoint.progress = 0;
              checkpoint.achievements.forEach(achievement => {
                achievement.progress = results[1][0][achievement.key] || 0;
                level.possibleAchievementsCount = level.possibleAchievementsCount + 1;
                if (Object.prototype.toString.call(achievement.progress) === "[object Object]") { // this covers the badges users have to complete
                  let date = moment(achievement.progress.toDate());
                  if (moment().diff(date, 'days') <= achievement.completedValue) {
                    achievement.complete = true;
                    achievement.fill = 100; // circle value
                    checkpoint.progress = checkpoint.progress + 100;
                    level.completedAchievementsCount = level.completedAchievementsCount + 1;
                    this.completedCount = this.completedCount + 1;
                  }
                } else if (achievement.progress >= achievement.completedValue || achievement.progress == true) { //already achieved
                  achievement.complete = true;
                  achievement.fill = 100; // circle value
                  checkpoint.progress = checkpoint.progress + 100;
                  level.completedAchievementsCount = level.completedAchievementsCount + 1;
                  this.completedCount = this.completedCount + 1;
                } else {
                  if (achievement.progress !== false) {
                    let progress = ((achievement.progress / achievement.completedValue) * 100)
                    achievement.fill = progress; // circle value
                    checkpoint.progress = checkpoint.progress + progress;
                  }
                }
              });
              checkpoint.progress = (checkpoint.progress / checkpoint.achievements.length) + '%';
            });
            if (level.completedAchievementsCount == level.possibleAchievementsCount) this.complianceLevel = this.complianceLevel + 1;
            if (this.completedCount == 0) this.accountService.showHelper = true;
        })
      });
    }
  });
}

routeOrPop(badge) {
  if (badge.routerLink) {
    this.router.navigate([badge.routerLink]);
  } else {
    let dialog = this.dialog.open(ConfirmCompleteDialog, {
      data: badge
    });
    dialog.afterClosed().subscribe(key => {
      if (key) { // save the date to completedAchievements
        let date = new Date();
        this.accountService.db.collection("completed-achievement").doc(this.completedAchievementsDocId).update({[key]: date});
      }
    })
  }
}

getAchievements() {
  let achievementsCollection = this.accountService.db.collection("achievement", ref => ref.orderBy("level"));
    return achievementsCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => { //better way
        const data = a.payload.doc.data() as Achievements;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    )
}

getCompletedAchievements() {
  let completedCollection = this.accountService.db.collection("completed-achievement", ref => ref.where("teamId", "==", this.accountService.aTeam.id));
    return completedCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => { //better way
        const data = a.payload.doc.data() as CompletedAchievements;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    )
  }
}


export class Achievements {
  id?: string;
  category: string;
  name: string;
  completedValue: number;
  key: string
  completedAchievementsCount: number;
  possibleAchievementsCount: number;
  fill;
  level;
  checkpoints;
}

export class CompletedAchievements {
  id?: string;
  teamId: string;
  achievementId: string;
  createdAt: Date;
}


@Component({
  selector: "app-map-dialog",
  template: `
  <h2 mat-dialog-title>Confirm Completion?</h2>
  <mat-dialog-content>
  This is a self-assesment badge. If you feel like this complete, click yes.
  </mat-dialog-content>
  <mat-dialog-actions style="margin-top:12px" align="end">
  <button mat-button color="primary" style="margin-right:8px" (click)="close(false)">CANCEL</button>
  <button mat-raised-button color="accent" style="color:#ffffff" (click)="close(true)">YES</button>
  </mat-dialog-actions>
  `
})
export class ConfirmCompleteDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfirmCompleteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close(save) {
    save ? this.dialogRef.close(this.data.key) : this.dialogRef.close();
  }
}