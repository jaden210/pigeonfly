import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router, ParamMap } from "@angular/router";
import { TrainingService, Topic } from "../training.service";
import { Observable, Subscription } from "rxjs";
import { AccountService } from "../../account.service";
import { MatDialog } from "@angular/material";
import { TopicDialogComponent } from "./topic-dialog/topic-dialog.component";
import { TopicsService } from "./topics.service";

@Component({
  selector: "app-topics",
  templateUrl: "./topics.component.html",
  styleUrls: ["./topics.component.css"],
  providers: [TopicsService]
})
export class TopicsComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  private userSubscription: Subscription;
  private industryId: string;
  public topics: Observable<Topic[]>;
  public isDev: boolean;

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
        this.setIsDev();
        this.route.paramMap.subscribe((params: ParamMap) => {
          this.industryId = params.get("industry");
          this.setActiveRoute();
          this.getTopics();
        });
      }
    });
  }

  private setIsDev(): void {
    this.userSubscription = this.accountService.userObservable.subscribe(
      user => {
        if (user) this.isDev = user.isDev;
      }
    );
  }

  private getTopics(forceRefresh = false): void {
    this.topics = this.service.getTopics(this.industryId, forceRefresh);
  }

  private setActiveRoute(): void {
    this.service.getIndustries().subscribe(industries => {
      const industry = industries.find(i => i.id == this.industryId);
      this.service.setActiveRoute(industry ? industry.name : null);
    });
  }

  public routeTo(topic: Topic): void {
    this.router.navigate([topic.id], { relativeTo: this.route });
  }

  public editTopic(topic: Topic): void {
    this.launchTopicDialog(topic);
  }

  public createTopic(): void {
    this.launchTopicDialog(new Topic());
  }

  private launchTopicDialog(topic: Topic): void {
    this.dialog
      .open(TopicDialogComponent, {
        data: { topic, industryId: this.industryId }
      })
      .afterClosed()
      .subscribe(topic => {
        if (topic) this.getTopics(true);
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.userSubscription.unsubscribe();
  }
}
