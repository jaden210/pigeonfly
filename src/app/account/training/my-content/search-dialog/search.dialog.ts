import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { BehaviorSubject } from "rxjs";
import { AccountService, User } from "src/app/account/account.service";

@Component({
  templateUrl: "./search.dialog.html",
  styleUrls: ["search.dialog.css"]
})
export class SearchDialog implements OnInit {
  users: BehaviorSubject<User[]>;
  searchParams: SearchParams;
  title1 = "Search MyContent";
  title2 = "Select Employee(s)";
  title: string;
  actionBtn: string = "APPLY";
  complianceTypes: any[] = [
    { key: "inCompliance", value: "In Compliance" },
    { key: "outOfCompliance", value: "Out of Compliance" },
    { key: "all", value: "All" }
  ];

  constructor(
    private accountService: AccountService,
    @Inject(MAT_DIALOG_DATA) private data: any,
    public dialogRef: MatDialogRef<SearchDialog>
  ) {}

  ngOnInit() {
    this.users = this.accountService.teamUsersObservable;
    this.searchParams = this.data.searchParams || new SearchParams();
    this.title = this.title1;
  }

  public selectEmployee(): void {
    this.title = this.title2;
  }

  public get EmployeesTitle(): string {
    return this.searchParams.employees.map(p => p.name).join(", ");
  }

  public back(): void {
    this.title = this.title1;
  }

  public reset(): void {
    this.searchParams = new SearchParams();
  }

  public apply(): void {
    this.dialogRef.close(this.searchParams);
  }
}

export class SearchParams {
  employees: User[] = [];
  string: string;
  complianceType: string = "all";
}
