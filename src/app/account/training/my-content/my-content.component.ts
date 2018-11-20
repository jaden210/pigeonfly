import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router, ParamMap } from "@angular/router";
import { TrainingService, MyContent } from "../training.service";
import { Observable, Subscription } from "rxjs";
import { AccountService } from "../../account.service";
import { MatDialog } from "@angular/material";
import { MyContentFiltersDialog } from "./my-content-filters.dialog";

@Component({
  templateUrl: "./my-content.component.html",
  styleUrls: ["./my-content.component.css"]
})
export class MyContentComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  private teamId: string;
  private industryId: string;
  private topicId: string;
  public myContent: Observable<MyContent[]>;
  public title: string;
  public searchVisible: boolean;
  public searchTerm: string;
  private complianceType: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: TrainingService,
    private accountService: AccountService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.subscription = this.accountService.aTeamObservable.subscribe(team => {
      if (team) {
        this.route.queryParamMap.subscribe(qpm => {
          this.complianceType = qpm.get("complianceType");
          this.teamId = team.id;
          this.title = "MyContent";
          this.myContent = this.service.getMyContent(team.id);
        });
      }
    });
  }

  public routeTo(articleId): void {
    this.router.navigate([articleId], { relativeTo: this.route });
  }

  public favorite(myContent: MyContent): void {
    this.service
      .getArticle(myContent.articleId, this.teamId)
      .subscribe(article => {
        this.service.favorite(article, this.teamId);
      });
  }

  public openFiltersDialog(): void {
    this.dialog
      .open(MyContentFiltersDialog, {
        data: { complianceType: this.complianceType }
      })
      .afterClosed()
      .subscribe(data => {
        this.router.navigate(["account", "training", "my-content"], {
          queryParams: { complianceType: data.complianceType }
        });
      });
  }

  public createArticle(): void {
    let queryParams = { industryId: this.industryId, topicId: this.topicId };
    this.router.navigate(["account/training/create-article"], { queryParams });
  }

  public goBack(): void {
    const activeRoute: string = this.router.url;
    const backRoute = activeRoute.substr(0, activeRoute.lastIndexOf("/"));
    this.router.navigate([backRoute]);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
