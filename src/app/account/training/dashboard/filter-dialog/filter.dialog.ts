import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { BehaviorSubject } from "rxjs";
import { AccountService, User } from "src/app/account/account.service";

@Component({
  templateUrl: "./filter.dialog.html",
  styleUrls: ["filter.dialog.css"]
})
export class FilterDialog implements OnInit {
  users: BehaviorSubject<User[]>;
  title: string = "Filter History Results";
  filterParams: FilterParams = new FilterParams();

  constructor(
    private accountService: AccountService,
    @Inject(MAT_DIALOG_DATA) private data: any,
    public dialogRef: MatDialogRef<FilterDialog>
  ) {}

  ngOnInit() {
    this.users = this.accountService.teamUsersObservable;
    this.filterParams = this.data.filterParams;
  }

  public selectReceivedTraining(): void {
    this.title = "Received Training";
  }

  public selectTrainingBy(): void {
    this.title = "Training By";
  }

  public get ReceivedTrainingTitle(): string {
    return this.filterParams.receivedTraining.map(p => p.name).join(", ");
  }

  public get TrainingByTitle(): string {
    return this.filterParams.trainingBy.map(p => p.name).join(", ");
  }

  public back(): void {
    this.title = "Search History";
  }

  public clear(): void {
    this.filterParams = new FilterParams();
  }

  public apply(): void {
    this.dialogRef.close(this.filterParams);
  }
}

export class FilterParams {
  receivedTraining: User[] = [];
  trainingBy: User[] = [];
  trainingDate: Date;
  articleName: string;
}
