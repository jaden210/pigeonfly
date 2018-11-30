import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { BehaviorSubject } from "rxjs";
import { AccountService, User } from "src/app/account/account.service";

@Component({
  templateUrl: "./filter.dialog.html",
  styleUrls: ["filter.dialog.css"]
})
export class EventsFilterDialog implements OnInit {
  users: BehaviorSubject<User[]>;
  title: string = "Filter History Results";

  constructor(
    private accountService: AccountService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<EventsFilterDialog>
  ) {}

  ngOnInit() {
    this.users = this.accountService.teamUsersObservable;
  }  

  public clear(): void {
    this.data.filterUsers = [];
    this.data.filterTypes = [];
  }

  public apply(): void {
    this.dialogRef.close(this.data);
  }
}
