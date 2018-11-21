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
import { SurveysService } from "../../surveys/surveys.service";
import { Survey } from "../../surveys/survey/survey";
import { UserHistoryDialog } from "./user-history.dialog";
import { NeedsTrainingDialog } from "./needs-training.dialog";
import { Location } from "@angular/common";

@Component({
  selector: "app-article",
  templateUrl: "./article.component.html",
  styleUrls: ["./article.component.css"],
  providers: [SurveysService]
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
  title: string;
  isMyArticle: boolean;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private service: TrainingService,
    private accountService: AccountService,
    private surveysService: SurveysService,
    private location: Location
  ) {}

  ngOnInit() {
    this.subscription = this.accountService.aTeamObservable.subscribe(team => {
      if (team) {
        this.users = this.accountService.teamUsersObservable;
        this.getIsDev();
        this.route.paramMap.subscribe((params: ParamMap) => {
          const articleId = params.get("article");
          this.teamId = team.id;
          this.service.getArticle(articleId, team.id).subscribe(article => {
            this.isMyArticle = articleId.includes(team.id);
            this.title = article.name;
            this.article = article;
            this.setIndustryId(params.get("industry"));
            this.buildButtons();
            this.loadData(article.content);
          });
        });
      }
    });
  }

  private setIndustryId(industryId): void {
    if (industryId) this.industryId = industryId;
    else
      this.service
        .getTopic(this.article.topicId, this.teamId)
        .subscribe(topic => {
          this.industryId = topic.industryId;
        });
  }

  srtBtn: string;
  currentBtn: string;
  private buildButtons() {
    if (this.article.myContent) {
      const srt = Object.keys(this.article.myContent.trainees).length;
      const nt = this.article.myContent.needsTraining.length;
      const tail = `should receive this training regularly`;
      this.srtBtn =
        srt == 1 ? `1 employee ${tail}` : `${srt} employees ${tail}`;
      this.currentBtn = `${srt -
        nt} of ${srt} employees are current on this training`;
    }
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
    this.service.favorite(this.article, this.teamId).then(() => {
      this.buildButtons();
    });
  }

  private getIsDev(): void {
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
        if (t.length) {
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
            this.service.updateMyContent(this.article.myContent, this.teamId);
            this.buildButtons();
          });
        } else {
          this.service.updateMyContent(this.article.myContent, this.teamId);
          this.buildButtons();
        }
      }
    });
  }

  public removeTrainee(trainee): void {
    delete this.article.myContent.trainees[trainee];
    this.service.updateMyContent(this.article.myContent, this.teamId);
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
    this.service
      .updateMyContent(this.article.myContent, this.teamId)
      .catch(error => {
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
    let trainees = this.article.myContent
      ? this.article.myContent.trainees
      : {};
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
        survey.category = "Safety Training";
        survey.title = `Did you participate in this training? -${
          this.article.name
        }`;
        survey.active = true;
        survey.articleId = this.article.id;
        survey.userSurvey = userSurvey;
        survey.userId = this.accountService.user.uid;
        this.surveysService.createSurvey(survey, this.teamId);
      }
    });
  }

  /* Called from template, if article.myContent */
  public openNeedsTrainingDialog(): void {
    let needsTrainingObj = {};
    let trainees = this.article.myContent.trainees || {};
    this.article.myContent.needsTraining.forEach(userId => {
      needsTrainingObj[userId] = trainees[userId];
    });
    let dialogRef = this.dialog.open(NeedsTrainingDialog, {
      data: { needsTrainingObj }
    });
    dialogRef.afterClosed().subscribe(showHistory => {
      if (showHistory) {
        // go to history
      }
    });
  }

  viewHistory(): void {
    this.router.navigate(["account/training/history", this.article.id]);
  }

  public goBack(): void {
    const activeRoute: string = this.router.url;
    if (activeRoute.includes("article")) this.location.back();
    else {
      const backRoute = activeRoute.substr(0, activeRoute.lastIndexOf("/"));
      this.router.navigate([backRoute]);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.userSubscription.unsubscribe();
  }
}
