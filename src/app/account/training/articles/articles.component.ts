import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router, ParamMap } from "@angular/router";
import { TrainingService, Article } from "../training.service";
import { Observable, of, Subscription } from "rxjs";
import { AccountService } from "../../account.service";

@Component({
  selector: "app-articles",
  templateUrl: "./articles.component.html",
  styleUrls: ["./articles.component.css"]
})
export class ArticlesComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  private teamId: string;
  private industryId: string;
  private topicId: string;
  public articles: Observable<Article[]>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: TrainingService,
    private accountService: AccountService
  ) {}

  ngOnInit() {
    this.subscription = this.accountService.aTeamObservable.subscribe(team => {
      if (team) {
        this.route.paramMap.subscribe((params: ParamMap) => {
          this.industryId = params.get("industry");
          this.topicId = params.get("topic");
          let topicId = params.get("topic");
          this.setActiveRoute(this.industryId, topicId, team.id);
          this.teamId = team.id;
          this.articles = this.service.getArticles(topicId, team.id);
        });
      }
    });
  }

  private setActiveRoute(industryId, topicId, teamId): void {
    this.service.getTopics(industryId).subscribe(topics => {
      const topic = topics.find(t => t.id == topicId);
      this.service.setActiveRoute(topic ? topic.name : null);
    });
  }

  public routeTo(article: Article): void {
    this.router.navigate([article.id], { relativeTo: this.route });
  }

  public favorite(article: Article): void {
    this.service.favorite(article, this.teamId);
  }

  public createArticle(): void {
    let queryParams = { industryId: this.industryId, topicId: this.topicId };
    this.router.navigate(["account/training/create-article"], { queryParams });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
