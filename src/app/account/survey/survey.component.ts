import { Component, OnInit } from "@angular/core";
import { trigger, style, transition, animate } from "@angular/animations";
import { AccountService, User } from "../account.service";
import { map, tap, take } from "rxjs/operators";
import { MatSnackBar } from "@angular/material";
import { SurveyService } from "./survey.service";
import { Observable, combineLatest } from "rxjs";
import { Survey } from "./survey";

@Component({
  selector: "app-survey",
  templateUrl: "./survey.component.html",
  styleUrls: ["./survey.component.css"],
  animations: [
    trigger("survey", [
      transition(":enter", [
        style({ transform: "translateY(100%)", opacity: 0 }),
        animate(
          "250ms ease-out",
          style({ transform: "translateY(0)", opacity: 1 })
        )
      ]),
      transition(":leave", [
        style({ transform: "translateY(0)", opacity: 1 }),
        animate(
          "250ms ease-in",
          style({ transform: "translateY(100%)", opacity: 0 })
        )
      ])
    ])
  ],
  providers: [SurveyService]
})
export class SurveyComponent implements OnInit {
  searchStr; // template variable
  filterUsers; // template variable

  surveys: Observable<Survey[]>;
  aSurvey: Survey = null;
  surveyUsers;
  create: boolean = false; // template variable

  week = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  constructor(
    public accountService: AccountService,
    public snackbar: MatSnackBar,
    private service: SurveyService
  ) {
    this.accountService.helper = this.accountService.helperProfiles.survey;
    combineLatest(
      this.accountService.teamUsersObservable,
      this.accountService.aTeamObservable
    ).subscribe(results => {
      if (results[0] && results[1]) {
        this.surveys = this.service.getSurveys(results[1].id).pipe(
          tap(surveys => {
            console.log(surveys);
            if (surveys.length == 0) this.accountService.showHelper = true;
          })
          // map(surveys =>
          //   surveys.map(survey => {
          //     let ranNumber = 0;
          //     Object.keys(survey.userSurvey).forEach(key => {
          //       if (survey.userSurvey[key] > 0) ranNumber += 1;
          //     });
          //     const ranPercent = ranNumber / results[0].length;
          //     return { ...survey, ranNumber, ranPercent };
          //   })
          // )
        );
      }
    });
  }

  ngOnInit() {}

  array(n: number): any[] {
    return Array(n);
  }

  startNewSurvey() {
    this.aSurvey = new Survey();
    this.create = true;
  }

  selectSurvey(survey) {
    this.aSurvey = survey;
    this.surveyUsers = [];
    this.service
      .getSurveyResponses(survey.id)
      .pipe(take(1))
      .subscribe(responses => {
        this.surveyUsers = responses;
      });
  }

  checkIfChecked(d) {
    // terribly inefficient
    return d ? this.aSurvey[d].indexOf(d) > -1 : null;
  }

  addTo(d) {
    if (this.aSurvey[d].find(day => day == d)) {
      this.aSurvey[d].splice(this.aSurvey[d].indexOf(d), 1);
    } else {
      this.aSurvey[d].push(d);
    }
  }

  saveSurvey(save) {
    if (save) {
      !this.aSurvey.id
        ? this.createSurvey()
        : this.service
            .updateSurvey(this.aSurvey)
            .then(() => (this.aSurvey = null));
    } else {
      this.aSurvey = null;
    }
  }

  createSurvey() {
    this.aSurvey.teamId = this.accountService.aTeam.id;
    this.aSurvey.createdAt = new Date();
    this.accountService.teamUsers.forEach(user => {
      this.aSurvey.userSurvey[user.id] = 0;
    });
    this.service.createSurvey(this.aSurvey).then(snapshot => {
      this.aSurvey = null;
    });
    this.create = false;
  }

  deleteSurvey() {
    this.service.deleteSurvey(this.aSurvey.id).then(() => {
      this.aSurvey = null;
      let snackbar = this.snackbar.open("survey deleted", null, {
        duration: 3000
      });
    });
  }
}
