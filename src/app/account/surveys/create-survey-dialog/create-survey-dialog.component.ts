import { Component, OnInit, Inject } from "@angular/core";
import { User } from "src/app/app.service";
import { AccountService } from "../../account.service";
import { BehaviorSubject } from "rxjs";
import { take } from "rxjs/operators";
import { Survey } from "../survey/survey";
import { SurveysService } from "../surveys.service";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

@Component({
  selector: "app-create-survey-dialog",
  templateUrl: "./create-survey-dialog.component.html",
  styleUrls: ["./create-survey-dialog.component.css"]
})
export class CreateSurveyDialogComponent implements OnInit {
  users: BehaviorSubject<User[]>;
  step: number = 1;
  sendOptions = [
    "Until Contact Responds",
    "Monthly",
    "Weekly",
    "Daily",
    "Once"
  ];
  sendOption: string = this.sendOptions[0];
  step3Subtitle: any;
  daysOfMonth: number[];
  daysOfWeek = [
    { name: "Sunday", val: 0 },
    { name: "Monday", val: 1 },
    { name: "Tuesday", val: 2 },
    { name: "Wednesday", val: 3 },
    { name: "Thursday", val: 4 },
    { name: "Friday", val: 5 },
    { name: "Saturday", val: 6 }
  ];
  surveyDom = [];
  surveyDow = [];
  surveyRunDate;
  surveyContacts = [];
  loading: boolean;
  survey: Survey = new Survey();
  isEdit: boolean;
  title: string = "New Survey";

  constructor(
    private service: SurveysService,
    private accountService: AccountService,
    public dialogRef: MatDialogRef<CreateSurveyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit() {
    this.daysOfMonth = Array.from(new Array(31), (val, index) => index + 1);
    this.users = this.accountService.teamUsersObservable;
    if (this.data && this.data.survey)
      this.configureEdit(this.data.survey, this.data.step);
  }

  private configureEdit(survey: Survey, step): void {
    this.survey = { ...survey };
    this.title = "Edit Survey";
    this.isEdit = true;
    this.step = step;
    if (step == 4) {
      this.surveyContacts = Object.keys(survey.userSurvey);
    }
    this.sendOption = survey.runOncePerUserSurvey
      ? this.sendOption[0]
      : survey.runOnDom.length
      ? this.sendOptions[1]
      : survey.runOnDow.length == 7
      ? this.sendOptions[3]
      : survey.runOnDow.length
      ? this.sendOptions[2]
      : this.sendOptions[4];
  }

  private getStep3Subtitle(): void {
    const so = this.sendOptions.indexOf(this.sendOption);
    const subtitle =
      so == 1
        ? "Select day(s) of the month to send the survey on"
        : so == 2
        ? "Select weekday(s) to send the survey on"
        : so == 4
        ? "Select a date to send the survey on"
        : this.next();
    this.step3Subtitle = subtitle;
  }

  public setDom(dom: number): void {
    let i = this.survey.runOnDom.indexOf(dom);
    if (i > -1) this.survey.runOnDom.splice(i, 1);
    else this.survey.runOnDom.push(dom);
  }

  public setDow(dow: number): void {
    let i = this.survey.runOnDow.indexOf(dow);
    if (i > -1) this.survey.runOnDow.splice(i, 1);
    else this.survey.runOnDow.push(dow);
  }

  public selectAllContacts(): void {
    if (this.surveyContacts.length) this.surveyContacts = [];
    else {
      this.users.pipe(take(1)).subscribe(users => {
        this.surveyContacts = users.map(u => u.id);
      });
    }
  }

  public back() {
    if (
      this.step == 4 &&
      (this.sendOption == "Until Contact Responds" ||
        this.sendOption == "Daily")
    )
      this.step -= 2;
    else this.step -= 1;
  }

  public next() {
    this.step += 1;
    if (this.step == 3) this.getStep3Subtitle();
  }

  public create() {
    this.loading = true;
    this.survey.active = true;
    let userSurvey = {};
    this.surveyContacts.forEach(sc => {
      userSurvey[sc] = 0;
    });
    this.survey.userSurvey = userSurvey;
    this.survey.teamId = this.accountService.aTeam.id;
    this.survey.userId = this.accountService.user.id;
    this.setRunTime();
    this.service
      .createSurvey(this.survey)
      .then(() => this.dialogRef.close())
      .catch(error => {
        this.dialogRef.close();
        console.error("Error creating survey", error);
        alert("Error creating survey");
      });
  }

  public save(): void {
    this.loading = true;
    if (this.step == 4) {
      let newUserSurvey = {};
      this.surveyContacts.forEach(contact => {
        newUserSurvey[contact] = this.survey.userSurvey[contact] || 0;
      });
      this.survey.userSurvey = newUserSurvey;
    } else if (this.step == 2 || this.step == 3) {
      this.setRunTime();
    }
    this.service
      .updateSurvey(this.survey)
      .then(() => this.dialogRef.close())
      .catch(error => {
        this.dialogRef.close();
        console.error("Error updating survey", error);
        alert("Error updating survey");
      });
  }

  private setRunTime(): void {
    this.survey.runOncePerUserSurvey = false;
    const runOnDate = this.survey.runOnceOnDate;
    switch (this.sendOption) {
      case "Until Contact Responds":
        this.survey.runOncePerUserSurvey = true;
        this.survey.runOnDom = [];
        this.survey.runOnDow = [];
        break;
      case "Monthly":
        this.survey.runOnDom = this.survey.runOnDom.sort();
        this.survey.runOnDow = [];
        break;
      case "Weekly":
        this.survey.runOnDow = this.survey.runOnDow.sort();
        this.survey.runOnDom = [];
        break;
      case "Daily":
        this.survey.runOnDom = [];
        this.survey.runOnDow = this.daysOfWeek.map(d => d.val);
        break;
      case "Once":
        this.survey.runOnceOnDate = runOnDate;
        this.survey.runOnDom = [];
        this.survey.runOnDow = [];
        break;
      default:
        break;
    }
  }

  public cancel(): void {
    this.dialogRef.close();
  }
}
