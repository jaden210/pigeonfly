import { Component, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { BehaviorSubject } from "rxjs";
import { User } from "src/app/app.service";
import { AccountService } from "../../account.service";

@Component({
  template: `
    <h1 mat-dialog-title>Employees</h1>
    <div mat-dialog-content>
      <p style="margin-top: 0; color: #757575">
        Who should receive this training regularly?
      </p>
      <mat-selection-list
        dense
        [(ngModel)]="shouldReceiveTraining"
        style="outline: none;"
      >
        <mat-list-option
          *ngFor="let user of (users | async)"
          [value]="user.uid"
        >
          <img
            matListAvatar
            [src]="user.profileUrl"
            onerror="src='/assets/face.png'"
          />
          <h3 matLine>{{ user.name }}</h3>
        </mat-list-option>
      </mat-selection-list>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>CANCEL</button>
      <button mat-button (click)="save()" color="primary">SAVE</button>
    </div>
  `
})
export class AddTraineeDialog {
  users: BehaviorSubject<User[]>;
  shouldReceiveTraining: string[] = [];

  constructor(
    private accountService: AccountService,
    public dialogRef: MatDialogRef<AddTraineeDialog>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {
    this.users = this.accountService.teamUsersObservable;
    this.shouldReceiveTraining = Object.keys(data);
  }

  save(): void {
    this.dialogRef.close(this.shouldReceiveTraining);
  }
}
