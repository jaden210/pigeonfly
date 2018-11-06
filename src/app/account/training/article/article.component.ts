import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from "@angular/core";
import { MatDialog } from "@angular/material";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import {
  TrainingService,
  Article,
  MyContent,
  TrainingExpiration
} from "../training.service";
import { Subscription, BehaviorSubject, Observable, forkJoin } from "rxjs";
import { AccountService, User } from "../../account.service";
import { AddTraineeDialog } from "./add-trainee.dialog";
import { AttendanceDialog } from "./attendance.dialog";
import { tap } from "rxjs/operators";
import { SurveyService } from "../../survey/survey.service";
import { Survey } from "../../survey/survey";
import { UserHistoryDialog } from "./user-history.dialog";

@Component({
  selector: "app-article",
  templateUrl: "./article.component.html",
  styleUrls: ["./article.component.css"],
  providers: [SurveyService]
})
export class ArticleComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  private userSubscription: Subscription;
  public article: Article;
  private teamId: string;
  private industryId: string;
  @ViewChild("dataContainer")
  dataContainer: ElementRef;
  isDev: boolean;
  users: BehaviorSubject<User[]>;
  /* Template variable to iterate over objects */
  objectKeys = Object.keys;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private service: TrainingService,
    private accountService: AccountService,
    private surveyService: SurveyService
  ) {}

  ngOnInit() {
    this.subscription = this.accountService.aTeamObservable.subscribe(team => {
      if (team) {
        this.users = this.accountService.teamUsersObservable;
        this.setIsDev();
        this.route.paramMap.subscribe((params: ParamMap) => {
          const articleId = params.get("article");
          this.teamId = team.id;
          this.industryId = params.get("industry");
          this.service.getArticle(articleId, team.id).subscribe(article => {
            this.service.setActiveRoute(article.name);
            this.article = article;
            this.loadData(article.content);
          });
        });
      }
    });
  }

  private loadData(html): void {
    // not the best way but this will preserve styling
    this.dataContainer.nativeElement.innerHTML = html;
  }

  public editArticle(): void {
    let queryParams = {
      articleId: this.article.id,
      industryId: this.industryId
    };
    this.router.navigate(["account/training/edit-article"], { queryParams });
  }

  public favorite(): void {
    this.service.favorite(this.article, this.teamId);
  }

  private setIsDev(): void {
    this.userSubscription = this.accountService.userObservable.subscribe(
      user => {
        if (user) this.isDev = user.isDev;
      }
    );
  }

  public isExpired(userId: string): boolean {
    return this.article.myContent.needsTraining.includes(userId);
  }

  public addTrainee(): void {
    /* mutating trainees by reference to an easier key */
    let trainees = this.article.myContent.trainees || {};
    let dialogRef = this.dialog.open(AddTraineeDialog, {
      data: trainees
    });
    let expDate = this.service.getTrainingExpirationDate(
      this.article.myContent.trainingExpiration
    );
    dialogRef.afterClosed().subscribe((traineeIds: string[]) => {
      if (traineeIds) {
        /* Delete from trainees */
        Object.keys(trainees).forEach(id => {
          if (traineeIds.indexOf(id) == -1) {
            delete trainees[id];
            let needsTraining = this.article.myContent.needsTraining;
            const i = needsTraining.indexOf(id);
            if (i > -1) needsTraining.splice(i, 1);
          }
        });
        /* Add to trainees */
        let t = traineeIds.filter(id => !(id in trainees));
        forkJoin(
          t.map(id =>
            this.service
              .getMostRecentTrainingForUserByArticle(
                id,
                this.teamId,
                this.article.id
              )
              .pipe(
                tap(lastTrainedDate => {
                  if (!lastTrainedDate[0] || lastTrainedDate[0] < expDate)
                    this.article.myContent.needsTraining.push(id);
                  trainees[id] = lastTrainedDate[0];
                })
              )
          )
        ).subscribe(() => {
          this.service.updateMyContent(this.article.myContent);
        });
      }
    });
  }

  public removeTrainee(trainee): void {
    delete this.article.myContent.trainees[trainee];
    this.service.updateMyContent(this.article.myContent);
    let needsTraining = this.article.myContent.needsTraining;
    const i = needsTraining.indexOf(trainee);
    if (i > -1) needsTraining.splice(i, 1);
  }

  public get Timeframe(): string[] {
    return Object.keys(TrainingExpiration).map(key => TrainingExpiration[key]);
  }

  public setTrainingExpiration(timeframe: TrainingExpiration): void {
    let myContent = this.article.myContent;
    const oldValue = this.article.myContent.trainingExpiration;
    myContent.trainingExpiration = timeframe;
    this.service.updateMyContent(this.article.myContent).catch(error => {
      this.article.myContent.trainingExpiration = oldValue;
      console.error("Error setting renewel timeframe on article", error);
    });
  }

  public viewHistoryByTrainee(trainee): void {
    this.dialog.open(UserHistoryDialog, {
      data: {
        user: this.accountService.teamUsers.find(user => user.uid == trainee),
        teamId: this.teamId,
        articleId: this.article.id
      }
    });
  }

  public startTraining(): void {
    let trainees = this.article.myContent.trainees || {};
    let dialogRef = this.dialog.open(AttendanceDialog, {
      data: trainees
    });
    dialogRef.afterClosed().subscribe((traineeIds: string[]) => {
      if (traineeIds) {
        let userSurvey = {};
        traineeIds.forEach(id => {
          userSurvey[id] = 0;
        });
        let survey = new Survey();
        survey.createdAt = new Date();
        survey.runType = "once";
        survey.category = "OSHA Training";
        survey.title = `Did you participate in this training? -- ${
          this.article.name
        }`;
        survey.active = true;
        survey.OSHAArticleId = this.article.id;
        survey.teamId = this.teamId;
        survey.userSurvey = userSurvey;
        this.surveyService.createSurvey(survey).then(data => {
          const surveyId = data.id;
          this.accountService.createEvent(
            "Safety Training",
            surveyId,
            this.accountService.user.uid,
            this.article.name,
            this.teamId
          );
        });
      }
    });
  }

  viewHistory(): void {
    this.router.navigate(["account/training/history", this.article.id]);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.userSubscription.unsubscribe();
  }
}
