import { Component, OnInit } from "@angular/core";
import { Subscription, BehaviorSubject, Observable } from "rxjs";
import { AccountService, User } from "../../account.service";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { Location } from "@angular/common";
import {
  TrainingService,
  Article,
  MyContent,
  TrainingExpiration
} from "../training.service";
import { map, tap } from "rxjs/operators";

@Component({
  selector: "app-training-history",
  templateUrl: "./training-history.component.html",
  styleUrls: ["./training-history.component.css"]
})
export class TrainingHistoryComponent implements OnInit {
  private subscription: Subscription;
  private userSubscription: Subscription;
  private teamId: string;
  public article: Article;
  isDev: boolean;
  users: BehaviorSubject<User[]>;
  history;
  noHistory: boolean;

  displayedColumns: string[] = ["date", "trainer", "attendees"];
  dataSource: Observable<TableData[]>;

  constructor(
    private accountService: AccountService,
    private route: ActivatedRoute,
    private service: TrainingService,
    private location: Location
  ) {}

  ngOnInit() {
    this.subscription = this.accountService.aTeamObservable.subscribe(team => {
      if (team) {
        this.users = this.accountService.teamUsersObservable;
        this.route.paramMap.subscribe((params: ParamMap) => {
          const articleId = params.get("article");
          this.teamId = team.id;
          this.service.getArticle(articleId, team.id).subscribe(article => {
            this.article = article;
            this.getHistory();
          });
        });
      }
    });
  }

  private getHistory(): void {
    this.dataSource = this.service
      .getTrainingHistoryByArticle(this.teamId, this.article.id)
      .pipe(
        map(surveys =>
          surveys.map(survey => {
            const date = survey.createdAt;
            const name = this.article.name;
            const trainer = survey.userId;
            const trainees = Object.keys(survey.userSurvey);
            const inAttendance = survey.receivedTraining;
            return { date, name, trainer, trainees, inAttendance };
          })
        ),
        tap(surveys => (this.noHistory = surveys.length ? false : true))
      );
  }

  public goBack(): void {
    this.location.back();
  }
}

export interface TableData {
  date: Date;
  name: string;
  trainer: string;
  trainees: string[];
  inAttendance: string[];
}
