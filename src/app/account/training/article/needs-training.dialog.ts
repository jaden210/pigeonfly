import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { User } from "src/app/app.service";
import { AccountService } from "../../account.service";
import { DatePipe } from "@angular/common";

@Component({
  template: `
    <h1 mat-dialog-title>Needs Training</h1>
    <div mat-dialog-content style="padding: 0;">
      <mat-list dense style="outline: none;">
        <mat-list-item *ngFor="let user of needsTraining">
          <img
            matListAvatar
            [src]="user.profileUrl"
            onerror="src='/assets/face.png'"
          />
          <h3 matLine>{{ user.name }}</h3>
          <h4 matLine>{{ user.lastTrained }}</h4>
        </mat-list-item>
      </mat-list>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>CANCEL</button>
      <button mat-button (click)="seeHistory()" color="primary">
        SEE HISTORY
      </button>
    </div>
  `
})
export class NeedsTrainingDialog implements OnInit {
  users: User[];
  needsTraining: any[] = [];

  constructor(
    private accountService: AccountService,
    private dialogRef: MatDialogRef<NeedsTrainingDialog>,
    private dataPipe: DatePipe,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit() {
    this.users = this.accountService.teamUsers || [];
    const needsTrainingObj = this.data.needsTrainingObj;
    for (let nt in needsTrainingObj) {
      const user = this.users.find(user => user.id == nt);
      const msLastTrained = needsTrainingObj[nt];
      console.log(msLastTrained);
      const lastTrained = !msLastTrained
        ? "Hasn't received training on this article"
        : `Last trained on ${this.dataPipe.transform(
            new Date(needsTrainingObj[nt])
          )}`;
      this.needsTraining.push({ ...user, lastTrained });
    }
  }

  seeHistory(): void {
    this.dialogRef.close(true);
  }
}
