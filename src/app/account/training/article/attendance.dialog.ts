import { Component, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { BehaviorSubject } from "rxjs";
import { User } from "src/app/app.service";
import { AccountService } from "../../account.service";

@Component({
  template: `
    <h1 mat-dialog-title>Who's in Attendance?</h1>
    <div mat-dialog-content>
        <mat-selection-list dense [(ngModel)]="trainees" style="outline: none;">
            <mat-list-option *ngFor="let user of users | async" [value]="user.uid">
                <img matListAvatar [src]="user.profileUrl" onerror="src='/assets/face.png'">
                <h3 matLine> {{user.name}} </h3>
            </mat-list-option>
        </mat-selection-list>
    </div>
    <div mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>CANCEL</button>
        <button mat-button (click)="save()" color="primary">START TRAINING</button>
    </div>
    `
})
export class AttendanceDialog {
  users: BehaviorSubject<User[]>;
  trainees: string[] = [];

  constructor(
    private accountService: AccountService,
    public dialogRef: MatDialogRef<AttendanceDialog>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {
    this.users = this.accountService.teamUsersObservable;
    this.trainees = Object.keys(data);
  }

  save(): void {
    this.dialogRef.close(this.trainees);
  }
}
