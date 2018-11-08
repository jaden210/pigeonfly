import { Component, OnInit } from "@angular/core";
import { trigger, style, transition, animate } from "@angular/animations";
import { AccountService, User } from "../../account.service";
import { map, tap, take } from "rxjs/operators";
import { MatSnackBar, MatDialog } from "@angular/material";
import { SurveysService } from "../surveys.service";
import { Observable, combineLatest } from "rxjs";
import { Survey } from "../survey/survey";
import { Router, ActivatedRoute } from "@angular/router";
import { CreateSurveyDialogComponent } from "../create-survey-dialog/create-survey-dialog.component";
import { PeopleDialogComponent } from "./people-dialog.component";

@Component({
  selector: "app-surveys-list",
  templateUrl: "./surveys-list.component.html",
  styleUrls: ["./surveys-list.component.css"]
})
export class SurveysListComponent implements OnInit {
  private teamId: string;
  surveys: Observable<Survey[]>;
  objectKeys = Object.keys;
  searchVisible: boolean;
  searchTerm: string;
  people: string[] = [];

  constructor(
    public accountService: AccountService,
    public snackbar: MatSnackBar,
    private service: SurveysService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.accountService.helper = this.accountService.helperProfiles.survey;
    this.accountService.aTeamObservable.subscribe(team => {
      if (team) {
        this.teamId = team.id;
        this.surveys = this.service.getSurveys(team.id).pipe(
          tap(surveys => {
            if (surveys.length == 0) this.accountService.showHelper = true;
          })
        );
      }
    });
  }

  public createSurvey(): void {
    this.dialog.open(CreateSurveyDialogComponent, { disableClose: true });
  }

  public routeTo(survey): void {
    this.service.survey = survey;
    this.router.navigate([survey.id], { relativeTo: this.route });
  }

  public filterByPeople(): void {
    let dialogRef = this.dialog.open(PeopleDialogComponent, {
      data: this.people
    });
    dialogRef.afterClosed().subscribe((people: string[]) => {
      this.people = people ? people : this.people;
    });
  }
}
