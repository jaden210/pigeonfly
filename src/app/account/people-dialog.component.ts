import { Component, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { BehaviorSubject } from "rxjs";
import { User } from "src/app/app.service";
import { AccountService } from "./account.service";

@Component({
  template: `
    <h1 mat-dialog-title>Filter By People</h1>
    <div mat-dialog-content>
      <mat-selection-list dense [(ngModel)]="people" style="outline: none;">
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
      <button mat-button (click)="clear()">CLEAR</button>
      <button mat-button (click)="save()" color="primary">APPLY</button>
    </div>
  `
})
export class PeopleDialogComponent {
  users: BehaviorSubject<User[]>;
  people: string[] = [];

  constructor(
    private accountService: AccountService,
    public dialogRef: MatDialogRef<PeopleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {
    this.users = this.accountService.teamUsersObservable;
    this.people = data;
  }

  clear(): void {
    this.people = [];
  }

  save(): void {
    this.dialogRef.close(this.people);
  }
}
