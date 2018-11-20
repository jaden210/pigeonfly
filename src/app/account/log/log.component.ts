import {
  Component,
  OnInit,
  ViewChild,
  Inject,
  HostListener,
  OnDestroy
} from "@angular/core";
import { trigger, style, transition, animate } from "@angular/animations";
import { Timeclock, AccountService, Log } from "../account.service";
import { map, tap, finalize } from "rxjs/operators";
import * as moment from "moment";
import { ImagesDialogComponent } from "../images-dialog/images-dialog.component";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Observable } from "rxjs";
import { PeopleDialogComponent } from "../people-dialog.component";

@Component({
  selector: "app-log",
  templateUrl: "./log.component.html",
  styleUrls: ["./log.component.css"],
  animations: [
    trigger("expand", [
      transition("void => *", [
        style({ height: 0 }),
        animate("400ms ease-in-out", style({}))
      ]),
      transition("* => void", [
        style({}),
        animate("400ms ease-in-out", style({ height: 0 }))
      ])
    ])
  ]
})
export class LogComponent implements OnDestroy {
  searchStr: string; // template variable
  searchVisible: boolean = true;
  filterUsers: string[] = [];

  logs: any = [];
  lastLog; // for pagination
  days = [];

  lat: number;
  long: number;




  now: any = moment().format("MMM");

  constructor(public accountService: AccountService, public dialog: MatDialog) {
    this.accountService.helper = this.accountService.helperProfiles.log;
    this.accountService.teamUsersObservable.subscribe(aTeam => {
      if (aTeam) {
        this.getLogs();
      }
    });
  }

  getLogs() {
    this.searchStr = this.accountService.searchForHelper; //sucks
    this.getTimeLogs().subscribe(logs => {
      if (logs.length == 0) return;
      this.logs = this.logs.concat(logs);
      if (this.logs.length == 0) {
        this.accountService.showHelper = true;
        return;
      }
      this.lastLog = logs[logs.length - 1];
      this.logs.forEach(log => {
        log.user = this.accountService.teamUsers.find(
          user => user.id == log.userId
        );
        if (!this.lat && log.LatPos) {
          // gives scope to the google map plugin
          this.lat = log.LatPos;
          this.long = log.LongPos;
        }
      });
      this.buildCalendar();
      this.onScroll();
    });
  }

  public getTimeLogs(): Observable<any> {
    return this.accountService.db
      .collection("log", ref => {
        if (!this.lastLog) {
          return ref
            .where("teamId", "==", this.accountService.aTeam.id)
            .orderBy("createdAt", "desc")
            .limit(50);
        } else {
          return ref
            .where("teamId", "==", this.accountService.aTeam.id)
            .orderBy("createdAt", "desc")
            .limit(20)
            .startAfter(this.lastLog.createdAt);
        }
      })
      .snapshotChanges()
      .pipe(
        map(actions => {
          return actions.map(a => {
            let data: any = a.payload.doc.data();
            return <Log>{
              ...data,
              id: a.payload.doc.id,
              createdAt: data["createdAt"].toDate(),
              updatedAt: data["updatedAt"] ? data["updatedAt"].toDate() : null
            };
          });
        })
      );
  }

  @HostListener("scroll", ["$event"])
  onScroll(event?: any) {
    if (!event) {
      if (
        document.getElementById("body").clientHeight <
        document.getElementById("window").clientHeight
      )
        this.getLogs(); // if there isn't enough results to pass the fold, load more
      return;
    }
    if (
      event.target.offsetHeight + event.target.scrollTop >=
      event.target.scrollHeight
    ) {
      this.getLogs();
    }
  }

  buildCalendar() {
    this.days = [];
    let now: any = new Date();
    let total_days = moment(now).diff(
      this.logs[this.logs.length - 1].createdAt,
      "days"
    );
    for (let i = 0; i <= total_days; i++) {
      let date = moment().subtract(i, "days");
      let month = date.format("MMM");
      let displayMonth = moment()
        .subtract(i, "days")
        .subtract(1, "month")
        .format("MMM");
      let day = date.format("DD");
      let dOW = date.format("ddd");
      let logs = this.getLogsByDate(date);
      this.days.push({
        id: i + 1,
        date,
        month,
        displayMonth,
        day,
        dOW,
        logs: logs.logs,
        loggers: logs.loggers
      });
    }
  }

  getLogsByDate(date) {
    let users = [];
    let logsOnDate: Log[] = this.logs.filter(log =>
      moment(log.createdAt).isSame(date, "day")
    );
    logsOnDate.forEach((day: Log) => {
      if (!users.find(user => user.id == day.userId)) {
        users.push(
          this.accountService.teamUsers.find(user => user.id == day.userId)
        );
      }
    });
    return { logs: logsOnDate, loggers: users };
  }

  showImages(images) {
    // TODO: Pass index so it opens to the right image when there are a bunch
    let dialog = this.dialog.open(ImagesDialogComponent, {
      data: images
    });
  }

  public filterByPeople(): void {
    let dialogRef = this.dialog.open(PeopleDialogComponent, {
      data: this.filterUsers
    });
    dialogRef.afterClosed().subscribe((people: string[]) => {
      this.filterUsers = people ? people : this.filterUsers;
    });
  }

  export() {}

  createEditLog(day, log?) {
    if (!log) {
      log = new Log();
      log.createdAt = day.date;
    }
    let dialog = this.dialog.open(CreateEditLogDialog, {
      data: log,
      disableClose: true
    });
    dialog.afterClosed().subscribe((log: Log) => {
      if (log) {
        delete log["bShowDetails"];
        delete log["user"];
        if (log.id) {
          log.updatedAt = new Date();
          log.updatedBy = this.accountService.user.name;
          log.updatedId = this.accountService.user.id;
          this.accountService.db
            .collection("log")
            .doc(log.id)
            .update({ ...log });
        } else {
          log.createdAt = new Date(log.createdAt);
          log.teamId = this.accountService.aTeam.id;
          log.userId = this.accountService.user.id;
          this.accountService.db
            .collection("log")
            .add({ ...log })
            .then(snapshot => {
              log.id = snapshot.id;
            });
        }
      }
    });
  }
  ngOnDestroy() {
    this.accountService.searchForHelper = '';
  }
}

@Component({
  selector: "create-edit-log-dialog",
  templateUrl: "create-edit-log-dialog.html",
  styleUrls: ["./log.component.css"]
})
export class CreateEditLogDialog {
  constructor(
    public dialogRef: MatDialogRef<CreateEditLogDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public accountService: AccountService
  ) {}

  close(log?): void {
    this.dialogRef.close(log);
  }

  delete() {
    this.accountService.db
      .collection("log")
      .doc(this.data.id)
      .delete()
      .then(() => this.dialogRef.close());
  }

  upload(): void {
    // this will call the file input from our custom button
    document.getElementById("upfile").click();
  }

  uploadImage(event) {
    let file = event.target.files[0];
    let filePath = this.accountService.user.id;
    let ref = this.accountService.storage.ref(filePath);
    let task = this.accountService.storage.upload(filePath, file);
    task
      .snapshotChanges()
      .pipe(
        finalize(() => {
          ref.getDownloadURL().subscribe(url => {
            this.data.images.push({ imageUrl: url });
          });
        })
      )
      .subscribe();
  }
}
