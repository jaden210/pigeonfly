import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { User } from "src/app/app.service";
import { AccountService } from "../../account.service";

@Component({
  template: `
    <h1 mat-dialog-title>Needs Training</h1>
    <div mat-dialog-content>
      <mat-list dense style="outline: none;">
        <mat-list-item *ngFor="let user of needsTraining">
          <img
            matListAvatar
            [src]="user.profileUrl"
            onerror="src='/assets/face.png'"
          />
          <h3 matLine>{{ user.name }}</h3>
        </mat-list-item>
      </mat-list>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>CANCEL</button>
      <button mat-button (click)="save()" color="primary">SEE HISTORY</button>
    </div>
  `
})
export class NeedsTrainingDialog {
  users: User[] = [];
  needsTraining: User[] = [];

  constructor(
    private accountService: AccountService,
    public dialogRef: MatDialogRef<NeedsTrainingDialog>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {
    // this.users = this.accountService.teamUsers;
    // this.needsTraining = Object.keys(data)
    // .map(id => {
    //   return this.users.find(user => user.id == id)
    // })
    // for (let srt of data) {
    //   if
    // }
  }

  save(): void {
    this.dialogRef.close();
  }
}
