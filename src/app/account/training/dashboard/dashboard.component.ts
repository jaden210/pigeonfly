import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy
} from "@angular/core";
import { TrainingService, MyContent } from "../training.service";
import { AccountService, User } from "../../account.service";
import { BehaviorSubject, Subscription } from "rxjs";
import { map, tap } from "rxjs/operators";
import { MatDialog } from "@angular/material";
import { Router } from "@angular/router";
import { ReceivedTrainingDialog } from "../training-history/received-training.dialog";
import { HelpDialog } from "../help.dialog";
import { FilterDialog, FilterParams } from "./filter-dialog/filter.dialog";
import { DatePipe } from "@angular/common";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"]
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
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
  filterParams: FilterParams = new FilterParams();

  displayedColumns: string[] = ["date", "articleName", "trainer", "attendees"];
  history: iTableData[];
  dataSource: iTableData[];
  isFiltered: boolean;
  loading: boolean;

  teamSubscription: Subscription;
  myContentSubscription: Subscription;
  historySubscription: Subscription;

  constructor(
    private trainingService: TrainingService,
    public accountService: AccountService,
    private dialog: MatDialog,
    private router: Router,
    private date: DatePipe
  ) {}

  ngAfterViewInit() {
    this.accountService.helper = this.accountService.helperProfiles.training;
    this.context = this.canvas.nativeElement.getContext("2d");
    this.scale = window.devicePixelRatio || 1;
    this.context.scale(2, 2);
    this.teamSubscription = this.accountService.aTeamObservable.subscribe(
      team => {
        if (team) {
          this.teamId = team.id;
          this.getMyContent();
          this.users = this.accountService.teamUsersObservable;
          setTimeout(() => this.getHistory(), 1);
        }
      }
    );
  }

  private getMyContent(): void {
    this.myContentSubscription = this.trainingService
      .getMyContent(this.teamId)
      .subscribe(myContent => {
        this.myContent = myContent;
        let totalTrainings = 0;
        let compliantTrainings = 0;
        myContent.forEach(mc => {
          const srt = Object.keys(mc.shouldReceiveTraining).length;
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
    this.loading = true;
    this.historySubscription = this.trainingService
      .getTrainingHistory(this.teamId)
      .pipe(
        map(surveys =>
          surveys.map(survey => {
            const date = survey.runDate;
            const mc = this.myContent.find(
              mc => mc.articleId == survey.articleId
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
        tap(surveys => {
          this.noHistory = surveys.length ? false : true;
          !surveys.length ? (this.accountService.showHelper = true) : null;
        })
      )
      .subscribe(history => {
        this.history = history;
        this.dataSource = history;
        this.loading = false;
      });
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

  public filter(): void {
    this.dialog
      .open(FilterDialog, {
        data: {
          filterParams: this.filterParams
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe((params: FilterParams) => {
        if (params) {
          this.filterParams = params;
          if (
            params.articleName ||
            params.receivedTraining.length ||
            params.trainingBy.length ||
            params.trainingDate
          ) {
            this.isFiltered = true;
            this.dataSource = this.history.filter(h => {
              if (params.trainingDate) {
                const t1 = this.date.transform(params.trainingDate);
                const t2 = this.date.transform(h.date);
                if (t1 == t2) return true;
              }
              for (let tb of params.trainingBy) {
                if (tb.id == h.trainer) return true;
              }
              for (let rt of params.receivedTraining) {
                if (h.trainees.includes(rt.id)) return true;
              }
              const searchTerms: string[] = params.articleName
                ? params.articleName.trim().split(/\s+/)
                : [];
              let passed;
              for (let f of searchTerms) {
                if (
                  h.articleName &&
                  h.articleName.toLowerCase().includes(f.toLowerCase())
                )
                  passed = true;
                else passed = false;
              }
              return passed;
            });
          } else {
            this.dataSource = this.history;
            this.isFiltered = false;
          }
        }
      });
  }

  public help(helpTopic: string): void {
    const helpContent =
      helpTopic == "myArticles"
        ? `When you click on CUSTOMIZE MY TRAINING, you’ll navigate to a host of pre-curated training articles. Clicking the 💜 button on a training article places that article in your collection. 
        Once articles are in your collection, we track compliance, by user, for each article. We call every article that is applicable to an employee a personal training. As an example, if you have 
        a team of 20, and you select two articles that apply to your entire team, we count that as 40 personal trainings that need to stay current in order for your team to be compliant. In other words, 
        there are 40 one-to-one relationships between employees and articles. Based on your team so far, we are tracking ${
          this.totalTrainings
        } personal trainings.`
        : helpTopic == "inCompliance"
        ? `Your team is current on ${
            this.compliantTrainings
          } personal trainings. A personal training is defined as the one-to-one relationship between an employee and a training article. Is Annie current on training X? 
        Is Jim current on training Y? Compliancechimp easily keeps a thorough record of training compliance, down to the personal level. To remain at Level 3 Compliance, this number needs to remain at 100%.`
        : `Let's get training! ${this.totalTrainings -
            this
              .compliantTrainings} personal trainings are out of compliance. This means there are training articles that have never been trained on, or, the last training date falls outside of the compliance timeframe set 
        on the training-article. Training is super easy. Gather your team together, open up the training article in the app, or here on the web, and click START TRAINING. This will send a first-person survey to every team 
        member you have selected. When they respond to the survey question, your compliance stats will be updated.`;
    this.dialog.open(HelpDialog, {
      data: helpContent,
      maxWidth: "50vw"
    });
  }

  public downloadCSV(): void {
    const date = new Date().toDateString();
    let data, filename, link;
    let csv = this.convertHistoryToCSV();
    if (csv === null) return;
    filename = `training_history_${date}.csv`;
    if (!csv.match(/^data:text\/csv/i)) {
      csv = "data:text/csv;charset=utf-8," + csv;
    }
    data = encodeURI(csv);
    link = document.createElement("a");
    link.setAttribute("href", data);
    link.setAttribute("download", filename);
    link.click();
  }

  private getUserName(userId): string {
    const user = this.accountService.teamUsers.find(u => u.id == userId);
    return user ? user.name : null;
  }

  private convertHistoryToCSV(): string {
    const headerMap = {
      date: "Date",
      articleName: "Article",
      trainer: "Training By",
      attendees: "Received Training"
    };
    if (!this.dataSource) return null;
    const columnDelimiter = ",";
    const lineDelimiter = "\n";
    const displayedColumns = this.displayedColumns.filter(c => headerMap[c]);
    let headers = "";
    displayedColumns.forEach(key => {
      headers += headerMap[key];
      headers += columnDelimiter;
    });
    let result = "";
    result += headers;
    result += lineDelimiter;
    this.dataSource.forEach(training => {
      const date = `"${this.date.transform(training.date)}"`;
      const article = `"${training.articleName}"`;
      const trainingBy = `"${this.getUserName(training.trainer)}"`;
      training.inAttendance.forEach(emp => {
        const empName = `"${this.getUserName(emp)}"`;
        result += [date, article, trainingBy, empName].join(columnDelimiter);
        result += lineDelimiter;
      });
    });
    return result;
  }

  ngOnDestroy() {
    if (this.teamSubscription) this.teamSubscription.unsubscribe();
    if (this.myContentSubscription) this.myContentSubscription.unsubscribe();
    if (this.historySubscription) this.historySubscription.unsubscribe();
  }
}

export interface iTableData {
  date: Date;
  articleName: string;
  trainer: string;
  trainees: string[];
  inAttendance: string[];
}
