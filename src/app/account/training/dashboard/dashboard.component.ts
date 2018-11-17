import { Component, AfterViewInit, ViewChild, ElementRef } from "@angular/core";
import { TrainingService, MyContent } from "../training.service";
import { AccountService, User } from "../../account.service";
import { Observable, BehaviorSubject } from "rxjs";
import { map, tap } from "rxjs/operators";

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
    private accountService: AccountService
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
          const date = survey.createdAt;
          const mc = this.myContent.find(
            mc => mc.articleId == survey.oshaArticleId
          );
          const articleName = mc ? mc.articleName : null;
          const trainer = survey.userId;
          const trainees = Object.keys(survey.userSurvey);
          const inAttendance = survey.receivedTraining;
          return { date, articleName, trainer, trainees, inAttendance };
        })
      ),
      tap(surveys => (this.noHistory = surveys.length ? false : true))
    );
  }
}

interface TableData {
  date: Date;
  articleName: string;
  trainer: string;
  trainees: string[];
  inAttendance: string[];
}
