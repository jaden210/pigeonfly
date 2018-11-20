import { Component, AfterViewInit, ViewChild, ElementRef } from "@angular/core";
import { TrainingService, MyContent } from "../training.service";
import { AccountService, User } from "../../account.service";
import { Observable, BehaviorSubject } from "rxjs";
import { map, tap } from "rxjs/operators";
import { MatDialog } from "@angular/material";
import { Router } from "@angular/router";
import { ReceivedTrainingDialog } from "../training-history/received-training.dialog";
import { HelpDialog } from "../help.dialog";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"]
})
export class DashboardComponent implements AfterViewInit {
  teamId: string;
  complianceLevel: number;
  @ViewChild("myCanvas")
  canvas: ElementRef;
  color: string;
  scale: number;
  scaled: boolean;
  context;
  totalTrainings;
  compliantTrainings;
  users: BehaviorSubject<User[]>;
  noHistory: boolean;
  myContent: MyContent[];

  displayedColumns: string[] = ["date", "articleName", "trainer", "attendees"];
  dataSource: Observable<TableData[]>;

  constructor(
    private trainingService: TrainingService,
    private accountService: AccountService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngAfterViewInit() {
    this.context = this.canvas.nativeElement.getContext("2d");
    this.scale = window.devicePixelRatio || 1;
    this.context.scale(2, 2);
    this.accountService.aTeamObservable.subscribe(team => {
      if (team) {
        this.teamId = team.id;
        this.getMyContent();
        this.users = this.accountService.teamUsersObservable;
        this.getHistory();
      }
    });
  }

  private getMyContent(): void {
    this.trainingService.getMyContent(this.teamId).subscribe(myContent => {
      this.myContent = myContent;
      let totalTrainings = 0;
      let compliantTrainings = 0;
      myContent.forEach(mc => {
        const srt = Object.keys(mc.trainees).length;
        const nt = mc.needsTraining.length;
        totalTrainings += srt;
        compliantTrainings += srt - nt;
      });
      this.totalTrainings = totalTrainings;
      this.compliantTrainings = compliantTrainings;
      this.draw(this.context);
    });
  }

  private draw(context): void {
    const complianceLevel = Math.ceil(
      (this.compliantTrainings / this.totalTrainings) * 100
    );
    let al = 0;
    const start = Math.PI * 1.5;
    const cw = context.canvas.width / (2 * 2);
    const ch = context.canvas.height / (2 * 2);
    let end;
    let currentEnd;
    var bar = setInterval(() => {
      end = (al / 100) * Math.PI * 2 + start;
      context.lineCap = "round";
      context.clearRect(0, 0, cw, ch);

      context.lineWidth = 4;
      context.strokeStyle = "#E91E63";
      context.beginPath();
      context.arc(cw, ch, 105, 0, 2 * Math.PI, false);
      context.fillStyle = "#FFF";
      context.fill();
      context.stroke();

      context.lineWidth = 8;
      context.strokeStyle = "#FFC107";
      context.beginPath();
      context.arc(cw, ch, 80, start, end, false);
      context.stroke();

      context.lineWidth = 20;
      context.strokeStyle = "#2196F3";
      context.beginPath();
      currentEnd =
        al >= complianceLevel
          ? (complianceLevel / 100) * Math.PI * 2 + start
          : end;
      context.arc(cw, ch, 86, start, currentEnd, false);
      context.stroke();

      context.textAlign = "center";
      context.font = "24pt Nunito";
      context.fillStyle = "#212121";
      context.textAlign = "center";
      let percent = al < complianceLevel ? al : complianceLevel;
      context.fillText(percent + "%", cw + 2, ch + 10);
      if (al >= 100) {
        clearTimeout(bar);
      }
      al++;
    }, 30);
  }

  private getHistory(): void {
    this.dataSource = this.trainingService.getTrainingHistory(this.teamId).pipe(
      map(surveys =>
        surveys.map(survey => {
          const date = survey.runDate;
          const mc = this.myContent.find(
            mc => mc.articleId == survey.oshaArticleId
          );
          const articleName = mc ? mc.articleName : null;
          const articleId = mc ? mc.articleId : null;
          const trainer = survey.userId;
          const trainees = Object.keys(survey.userSurvey);
          const inAttendance = survey.receivedTraining;
          return {
            date,
            articleName,
            trainer,
            trainees,
            inAttendance,
            articleId
          };
        })
      ),
      map(surveys => surveys.filter(s => s.articleId)),
      tap(surveys => (this.noHistory = surveys.length ? false : true))
    );
  }

  public routeToMyContent(complianceType: string): void {
    this.router.navigate(["account", "training", "my-content"], {
      queryParams: { complianceType }
    });
  }

  public routeToArticle(articleId): void {
    this.router.navigate(["account", "training", "article", articleId]);
  }

  public openReceivedTrainingDialog(survey): void {
    this.dialog.open(ReceivedTrainingDialog, {
      data: { people: survey.inAttendance }
    });
  }

  public help(helpTopic: string): void {
    const helpContent =
      helpTopic == "myArticles"
        ? `Clicking the 💜 button on a training-article places that article in your own custom-training-articles collection. Once here 
    ComplianceChimp can track compliance, by user, for each article. The training-article to employee relationship is defined as a personal training. In your team's case
    there are an average of ${(
      this.totalTrainings / this.myContent.length
    ).toFixed(1)} employees per training or ${
            this.totalTrainings
          } personal-trainings to keep track of.`
        : helpTopic == "inCompliance"
        ? `Great! Your team is current on ${
            this.compliantTrainings
          } personal trainings! A personal training is defined as an employee's relation to a training article.
     For example, if 2 employees should receive training on the "How to remove pizza from a hot oven" training article, you would have 2 personal trainings to keep track of. Is Annie
     current on this training? Is Joe current on this training? This is how ComplianceChimp can keep a thorough record of who is in compliance with yours' and OSHA's safety standards.`
        : `Let's get training! ${this.totalTrainings -
            this
              .compliantTrainings} personal trainings are out of compliance. This means there are x number of employees times x number of 
     training-articles that have never been trained on, or, the last training date falls outside of the compliance timeframe set on the training-article. Lets say you have a training-article
     "How to remove pizza from a hot oven". This article requires that 2 people, Annie and Joe stay trained on this article. In this scenario you have 2 personal-trainings to keep track of:
     Annie's training on "How to remove pizza from a hot oven" and Joes training on the same article.This is how ComplianceChimp can keep a thorough record of who is in compliance with yours' and OSHA's safety standards.`;
    this.dialog.open(HelpDialog, {
      data: helpContent,
      maxWidth: "50vw"
    });
  }
}

interface TableData {
  date: Date;
  articleName: string;
  trainer: string;
  trainees: string[];
  inAttendance: string[];
}
