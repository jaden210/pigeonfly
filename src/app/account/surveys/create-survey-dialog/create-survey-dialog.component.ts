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
  step3Subtitle: any;
  surveyContacts = [];
  loading: boolean;
  survey: Survey = new Survey();
  isEdit: boolean;
  title: string = "New Survey";
  teamId: string;

  constructor(
    private service: SurveysService,
    private accountService: AccountService,
    public dialogRef: MatDialogRef<CreateSurveyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit() {
    this.users = this.accountService.teamUsersObservable;
    this.teamId = this.accountService.aTeam.id;
    if (this.data && this.data.survey)
      this.configureEdit(this.data.survey, this.data.step);
  }

  private configureEdit(survey: Survey, step): void {
    this.survey = { ...survey };
    this.title = "Edit Survey";
    this.isEdit = true;
    this.step = step;
    if (step == 3) {
      this.surveyContacts = Object.keys(survey.userSurvey);
    }
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
    this.step -= 1;
  }

  public next() {
    this.step += 1;
  }

  public create() {
    this.loading = true;
    this.survey.active = true;
    let userSurvey = {};
    this.surveyContacts.forEach(sc => {
      userSurvey[sc] = 0;
    });
    this.survey.userSurvey = userSurvey;
    this.survey.userId = this.accountService.user.id;
    this.service
      .createSurvey(this.survey, this.accountService.aTeam.id)
      .then(() => this.dialogRef.close())
      .catch(error => {
        this.dialogRef.close();
        console.error("Error creating survey", error);
        alert("Error creating survey");
      });
  }

  public save(): void {
    this.loading = true;
    if (this.step == 3) {
      let newUserSurvey = {};
      this.surveyContacts.forEach(contact => {
        newUserSurvey[contact] = this.survey.userSurvey[contact] || 0;
      });
      this.survey.userSurvey = newUserSurvey;
    }
    this.service
      .updateSurvey(this.survey, this.accountService.aTeam.id)
      .then(() => this.dialogRef.close())
      .catch(error => {
        this.dialogRef.close();
      });
  }

  public cancel(): void {
    this.dialogRef.close();
  }
}
