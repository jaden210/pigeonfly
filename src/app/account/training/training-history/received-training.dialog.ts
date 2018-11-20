import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { User } from "src/app/app.service";
import { AccountService } from "../../account.service";
import { DatePipe } from "@angular/common";

@Component({
  template: `
    <h1 mat-dialog-title>Received Training</h1>
    <div mat-dialog-content style="padding: 0; width: 320px;">
      <mat-list dense style="outline: none;">
        <mat-list-item *ngFor="let user of receivedTraining">
          <img
            matListAvatar
            [src]="user.profileUrl"
            onerror="src='/assets/face.png'"
          />
          <h3 matLine>{{ user.name }}</h3>
          <h4 matLine>{{ user.jobTitle }}</h4>
        </mat-list-item>
      </mat-list>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>CLOSE</button>
    </div>
  `
})
export class ReceivedTrainingDialog implements OnInit {
  users: User[];
  receivedTraining: User[] = [];

  constructor(
    private accountService: AccountService,
    private dialogRef: MatDialogRef<ReceivedTrainingDialog>,
    private dataPipe: DatePipe,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit() {
    this.users = this.accountService.teamUsers || [];
    const people = this.data.people || [];
    for (let person of people) {
      const user = this.users.find(user => user.id == person);
      this.receivedTraining.push(user);
    }
  }
}
