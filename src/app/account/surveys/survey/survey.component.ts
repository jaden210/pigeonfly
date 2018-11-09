import { Component, OnInit, OnDestroy } from "@angular/core";
import { SurveysService } from "../surveys.service";
import { MatSnackBar, MatDialog } from "@angular/material";
import { AccountService, User } from "../../account.service";
import { Observable, Subscription, combineLatest, of } from "rxjs";
import { ActivatedRoute, Router, ParamMap } from "@angular/router";
import { Survey } from "../survey/survey";
import { Location, DatePipe } from "@angular/common";
import { map, groupBy, flatMap, toArray, share, tap } from "rxjs/operators";
import { CreateSurveyDialogComponent } from "../create-survey-dialog/create-survey-dialog.component";

@Component({
  selector: "app-survey",
  templateUrl: "./survey.component.html",
  styleUrls: ["./survey.component.css"]
})
export class SurveyComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  private todaysDatePiped: string;
  public usersGroup: User[];
  public survey: Survey | any;
  public title: string;
  public users: User[];
  public surveyResponseList: Observable<any[]>;
  public runType: string;
  public surveyResponseListLength: number;
  private colors = [
    "#FF6F00",
    "#B71C1C",
    "#880E4F",
    "#4A148C",
    "#311B92",
    "#1A237E",
    "#01579B",
    "#006064",
    "#BF360C",
    "#1B5E20"
  ];

  constructor(
    private service: SurveysService,
    private snackbar: MatSnackBar,
    private accountService: AccountService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private location: Location,
    private datePipe: DatePipe
  ) {
    this.todaysDatePiped = this.datePipe.transform(
      new Date(),
      "EEEE, MMM d, y"
    );
  }

  ngOnInit() {
    this.subscription = combineLatest(
      this.accountService.aTeamObservable,
      this.accountService.teamUsersObservable
    ).subscribe(results => {
      if (results[0] && results[1]) {
        this.users = results[1];
        this.route.paramMap.subscribe((params: ParamMap) => {
          let surveyId = params.get("surveyId");
          if (surveyId) {
            this.getSurvey(surveyId);
            this.getSurveyResponses(surveyId);
          }
        });
      }
    });
  }

  private getSurvey(surveyId): void {
    this.service.getSurvey(surveyId).subscribe(survey => {
      this.title = "/ " + survey.category;
      this.getGroup(Object.keys(survey.userSurvey));
      survey["user"] = this.users.find(u => u.uid == survey.userId);
      this.survey = survey;
      this.getRunType();
      this.getSurveyResponses(surveyId);
    });
  }

  /* This is to build the runType button */
  private getRunType(): void {
    if (this.survey.runOnDom.length) {
      this.runType = "Run survey monthly on the";
      const s = ["th", "st", "nd", "rd"];
      this.survey.runOnDom.forEach(day => {
        let d = day % 100;
        this.runType += " " + day + (s[(d - 20) % 10] || s[d] || s[0]);
      });
    } else if (this.survey.runOnDow.length) {
      if (this.survey.runOnDow.length == 7) {
        this.runType = "Run survey daily";
      } else {
        const daysOfWeek = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday"
        ];
        this.runType = "Run survey weekly on";
        this.survey.runOnDow.forEach(weekdayIndex => {
          this.runType += " " + daysOfWeek[weekdayIndex];
        });
      }
    } else if (this.survey.runOnceOnDate) {
      this.runType = `Run survey once on ${this.datePipe.transform(
        this.survey.runOnceOnDate
      )}`;
    } else if (this.survey.runOncePerUserSurvey) {
      this.runType = "Run survey until all contacts respond";
    }
  }

  /* Builds all contacts of the survey and colors them */
  private getGroup(userIds: string[]): void {
    this.usersGroup = [];
    let colorsMap = {};
    let colorsIndex = 0;
    userIds.forEach(userId => {
      let user = this.users.find(user => user.uid == userId);
      if (colorsMap[userId]) user["color"] = colorsMap[userId];
      else {
        user["color"] = this.colors[colorsIndex];
        colorsMap[userId] = this.colors[colorsIndex];
        colorsIndex =
          colorsIndex + 1 > this.colors.length - 1 ? 0 : colorsIndex + 1;
      }
      this.usersGroup.push(user);
    });
  }

  /* Grouping by date to show group date in template */
  private getSurveyResponses(surveyId): void {
    this.surveyResponseList = this.service.getSurveyResponses(surveyId).pipe(
      map(responses =>
        responses.map(response => {
          response["user"] = this.usersGroup.find(
            u => u.uid == response.userId
          );
          response["groupByDate"] = this.getGroupByDate(response.createdAt);
          return response;
        })
      ),
      flatMap(recordings => {
        let r = of(recordings).pipe(
          flatMap(r => r),
          groupBy(sr => sr["groupByDate"]),
          flatMap(obs =>
            obs.pipe(
              toArray(),
              map(r => ({ date: r[0]["groupByDate"], responses: r }))
            )
          ),
          toArray()
        );
        return combineLatest(r, rr => {
          return rr;
        });
      }),
      tap(responses => (this.surveyResponseListLength = responses.length)),
      share()
    );
  }

  /* Builds date without time to group by and display */
  private getGroupByDate(date: Date): string {
    let ds = this.datePipe.transform(date, "EEEE, MMM d, y");
    if (this.todaysDatePiped == ds) return "Today";
    return ds;
  }

  /* Not used currently */
  deleteSurvey(survey) {
    this.service.deleteSurvey(survey).then(() => {
      this.survey = null;
      let snackbar = this.snackbar.open("survey deleted", null, {
        duration: 3000
      });
    });
  }

  public editSurvey(step: number): void {
    /* **step - which step of the dialog is being edited.
    1 = Category and Title, 2 = Run Date, 4 = Contacts. */
    if (step == 1 && this.surveyResponseListLength) {
      alert(
        "You cannot change the survey question or category after a receiving a response."
      );
    } else {
      this.dialog.open(CreateSurveyDialogComponent, {
        disableClose: true,
        data: { survey: this.survey, step }
      });
    }
  }

  /* called when flipping active toggle */
  public updateSurvey(active): void {
    this.survey.active = active;
    delete this.survey["user"];
    delete this.survey.id;
    this.service.updateSurvey(this.survey);
  }

  public goBack(): void {
    this.location.back();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
