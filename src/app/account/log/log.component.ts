import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { AccountService, User } from "../account.service";
import { map, tap, share } from "rxjs/operators";
import { ImagesDialogComponent } from "../images-dialog/images-dialog.component";
import { MatDialog, MatSnackBar } from "@angular/material";
import { MapDialogComponent } from "../map-dialog/map-dialog.component";
import { LogService, Log } from "./log.service";
import { Observable, forkJoin, of } from "rxjs";
import { DatePipe } from "@angular/common";
import { MatMenuTrigger } from "@angular/material";
import { SearchDialog, SearchParams } from "./search-dialog/search.dialog";

@Component({
  selector: "app-log",
  templateUrl: "./log.component.html",
  styleUrls: ["./log.component.css"],
  providers: [LogService]
})
export class LogComponent implements OnInit, OnDestroy {
  private searchParams: SearchParams;
  searchStr: string; // template variable
  searchVisible: boolean = true;
  filterUsers: string[] = [];
  sending: boolean;
  showView: boolean;
  scrollPosition: number = 0;
  limit: number = 0;
  allowLoad: boolean = true;
  loading: boolean;

  @ViewChild("window") window;
  @ViewChild("logs") contentArea;
  @ViewChild("myInput") myInput;
  @ViewChild("textbox") textbox;
  @ViewChild("buffer") buffer;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

  /* temporary logs while log is sending */
  public responseLogs = [];

  /* user clicks to resend log on error */
  public errorIcon: boolean;

  /* description of log */

  public description: string;

  /* group is greated to group by date */
  public logsGroup: Observable<any[]>;

  private todaysDatePiped: string;
  private teamId: string;
  public users: User[];
  private colors = [
    "#FF6F00",
    "#880E4F",
    "#311B92",
    "#1B5E20",
    "#B71C1C",
    "#1A237E",
    "#BF360C",
    "#01579B",
    "#4A148C",
    "#006064"
  ];

  /* temp container for images, previews etc */
  public images: any[] = [];

  logs: Log[];
  isSearch: boolean;

  constructor(
    private service: LogService,
    private accountService: AccountService,
    private datePipe: DatePipe,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.searchParams = new SearchParams();
    this.accountService.helper = this.accountService.helperProfiles.log;
    this.todaysDatePiped = this.datePipe.transform(
      new Date(),
      "EEEE, MMM d, y"
    );
    this.accountService.teamUsersObservable.subscribe(users => {
      if (users) {
        this.teamId = this.accountService.aTeam.id;
        this.setUsers(users);
        this.getLogs();
      }
    });
  }

  /* Builds all contacts of the logs and colors them */
  private setUsers(users: User[]): void {
    let colorsIndex = 0;
    this.users = users.map(user => {
      user["color"] = this.colors[colorsIndex];
      colorsIndex =
        colorsIndex + 1 > this.colors.length - 1 ? 0 : colorsIndex + 1;
      return user;
    });
  }

  private getLogs(): void {
    this.loading = true;
    this.limit += 40;
    this.service.getLogs(this.teamId, this.limit).subscribe(logs => {
      if (!this.isSearch) {
        this.logs = logs.reverse();
        if (logs.length < this.limit) this.allowLoad = false;
        if (this.logSending) this.checkIfShouldWipeLogSending(logs);
        this.buildLogGroups();
      }
    });
  }

  private buildLogGroups(): void {
    this.logsGroup = of(this.logs).pipe(
      map(logs => {
        let map = {};
        logs.forEach(log => {
          /* transforming timestamp to day specific date */
          let gbd = this.getGroupByDate(log.createdAt);
          /* transforming timestamp to time */
          let gbt = this.datePipe.transform(log.createdAt, "shortTime");
          /* grouping logs by date */
          map[gbd] = map[gbd] || {};
          /* grouping logs that are less than 1 minute apart */
          map[gbd][log.userId + "-" + gbt] =
            map[gbd][log.userId + "-" + gbt] || [];
          let images = log.images || [];
          /* creating pseudo log for images to show in own bubble */
          images.forEach(image => {
            let pseudoLog = new Log();
            pseudoLog.createdAt = log.createdAt;
            pseudoLog.userId = log.userId;
            pseudoLog.imageUrl = image;
            pseudoLog.id = log.id;
            map[gbd][log.userId + "-" + gbt].push(pseudoLog);
          });
          if (log.description) map[gbd][log.userId + "-" + gbt].push(log);
        });
        let n = Object.keys(map).map(key => {
          let date = key;
          let byAuthorObj = map[key];
          let logsByAuthor = Object.keys(byAuthorObj).map(key2 => {
            let logs = map[key][key2];
            let time = key2.split("-")[1];
            let userId = key2.split("-")[0];
            let author = this.getAuthor(userId);
            /* is this a log from me */
            let isMe = userId == this.accountService.user.id;
            return { author, logs, time, isMe };
          });
          return { date, logsByAuthor };
        });
        return n;
      }),
      tap(() => this.scrollToPosition()),
      share()
    );
  }

  /* if id coming in from getLogs == the id of the log we're sending
  then wipe out the temporary response logs and clear sending flag */
  private checkIfShouldWipeLogSending(logs: Log[]): void {
    let i = logs.findIndex(log => log.id == this.logSending.id);
    if (i > -1) {
      this.sending = false;
      this.responseLogs = [];
      this.logSending = null;
    }
  }

  private scrollToPosition(): void {
    setTimeout(() => {
      this.contentArea.nativeElement.scrollTop =
        this.contentArea.nativeElement.scrollHeight - this.scrollPosition;
      this.loading = false;
      this.showView = true;
    }, 250);
  }

  /* Builds date without time to group by and display */
  private getGroupByDate(date: Date): string {
    let ds = this.datePipe.transform(date, "EEEE, MMM d, y");
    if (this.todaysDatePiped == ds) return "Today";
    return ds;
  }

  private getAuthor(userId): User {
    return this.users.find(user => user.id == userId);
  }

  /* Meh, not super efficient */
  public search(): void {
    this.dialog
      .open(SearchDialog, {
        data: { searchParams: this.searchParams },
        disableClose: true
      })
      .afterClosed()
      .subscribe((params: SearchParams) => {
        if (params) {
          this.searchParams = params;
          if (
            params.employees.length ||
            params.date ||
            params.string ||
            params.imagesOnly
          ) {
            this.loading = true;
            this.isSearch = true;
            this.service.getAllLogs(this.teamId).subscribe(logs => {
              this.logs = logs
                .filter(log => {
                  if (params.employees.length)
                    return params.employees.includes(log.userId);
                  if (params.date) {
                    const pd = this.datePipe.transform(params.date);
                    const ld = this.datePipe.transform(log.createdAt);
                    return pd == ld;
                  }
                  if (params.string) {
                    let filter: string[] = params.string.trim().split(/\s+/);
                    let match;
                    for (let f of filter) {
                      if (
                        log.description &&
                        log.description.toLowerCase().includes(f.toLowerCase())
                      )
                        return true;
                    }
                    return false;
                  }
                  if (params.imagesOnly) return log.imageUrl ? true : false;
                })
                .reverse();
              this.buildLogGroups();
            });
          } else {
            this.isSearch = false;
            this.getLogs();
          }
        }
      });
  }

  /* resizes the input box */
  public resize(): void {
    const sh = this.myInput.nativeElement.scrollHeight;
    this.myInput.nativeElement.style.height = "28px";
    this.myInput.nativeElement.style.height =
      sh > 90 ? "90px" : this.myInput.nativeElement.scrollHeight - 14 + "px";
  }

  public getImage(): void {
    document.getElementById("upfile").click();
  }

  public uploadImage(event) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      var reader = new FileReader();
      reader.onload = (event: any) => {
        const previewImage = event.target.result;
        this.setImage({ previewImage, file });
      };
      reader.readAsDataURL(file);
    }
  }

  public removeImage(image): void {
    let i = this.images.indexOf(image);
    this.images.splice(i, 1);
    setTimeout(() => {
      const teh = this.textbox.nativeElement.clientHeight;
      this.buffer.nativeElement.style.height = `${teh}px`;
      this.scrollToPosition();
    }, 0);
  }

  public setImage(imageObj): void {
    this.images.push(imageObj);
    setTimeout(() => {
      const teh = this.textbox.nativeElement.clientHeight;
      this.buffer.nativeElement.style.height = `${teh}px`;
      this.scrollPosition = 0;
      this.scrollToPosition();
    }, 0);
  }

  public viewImage(imageUrl): void {
    this.dialog.open(ImagesDialogComponent, {
      data: [{ imageUrl }]
    });
  }

  longPressTimer;
  public longPressStart(): void {
    this.longPressTimer = setTimeout(() => {
      this.trigger.openMenu();
    }, 1000);
  }

  public longPressEnd(): void {
    if (this.longPressTimer) clearTimeout(this.longPressTimer);
  }

  public createLog(): void {
    this.buildResponseLogs();
    this.sending = true;
    let log = new Log();
    log.createdAt = new Date();
    log.userId = this.accountService.user.id;
    log.description = this.description;
    log.images = [...this.images];
    this.description = null;
    this.images = [];
    this.persistLog(log);
  }

  /* temporary logs shown while sending */
  private buildResponseLogs(): void {
    if (this.description)
      this.responseLogs.push({ description: this.description });
    let responseImages = this.images.map(imgObj => imgObj.previewImage);
    responseImages.forEach(imageUrl => this.responseLogs.push({ imageUrl }));
    this.scrollPosition = 0;
    setTimeout(() => this.scrollToPosition(), 10);
  }

  /* back up log to retry on fail */
  private logSending: Log;
  private persistLog(log: Log): void {
    log.id = this.service.generateLogId(this.teamId);
    this.logSending = log;
    this.persistImages(log.images).subscribe(
      images => {
        log.images = images;
        this.service.createLog(log, this.teamId).catch(() => {
          this.sending = false;
          this.errorIcon = true;
        });
      },
      error => (this.errorIcon = true)
    );
  }

  private persistImages(images): Observable<any[]> {
    return images.length
      ? forkJoin(
          images.map(imgObj =>
            this.service.uploadImage(imgObj.file, this.teamId)
          )
        )
      : of([]);
  }

  public resendLog(): void {
    this.persistLog(this.logSending);
  }

  showMap(log) {
    this.dialog.open(MapDialogComponent, {
      data: {
        longPos: log.LongPos,
        latPos: log.LatPos
      }
    });
  }

  loadMore() {
    this.scrollPosition = this.contentArea.nativeElement.scrollHeight;
    this.getLogs();
  }

  deleteLog(pseudoLog: Log) {
    const log = this.logs.find(l => l.id == pseudoLog.id);
    const recoverLog = JSON.parse(JSON.stringify(log));
    const recoverPseudoLog = { ...pseudoLog };
    let action;

    if (pseudoLog.description) {
      log.description = null;
    } else if (pseudoLog.imageUrl) {
      let i = log.images.indexOf(pseudoLog.imageUrl);
      log.images.splice(i, 1);
    }
    if (!log.description && !log.images.length) {
      this.service.deleteLog(log.id, this.teamId).then(() => {
        let sbr = this.snackBar.open("Successfully deleted log", "UNDO", {
          duration: 5000
        });
        sbr.onAction().subscribe(() => {
          action = true;
          recoverLog.id = this.service.generateLogId(this.teamId);
          recoverLog.createdAt = new Date(recoverLog.createdAt);
          this.service.createLog(recoverLog, this.teamId);
        });
        sbr.afterDismissed().subscribe(() => {
          if (!action && recoverPseudoLog.imageUrl)
            this.service.removeImage(recoverPseudoLog.imageUrl);
        });
      });
    } else {
      this.service.updateLog(log, this.teamId).then(() => {
        let sbr = this.snackBar.open("Successfully deleted log", "UNDO", {
          duration: 5000
        });
        sbr.onAction().subscribe(() => {
          action = true;
          recoverLog.createdAt = new Date(recoverLog.createdAt);
          this.service.updateLog(recoverLog, this.teamId);
          this.getLogs();
        });
        sbr.afterDismissed().subscribe(() => {
          if (!action && recoverPseudoLog.imageUrl)
            this.service.removeImage(recoverPseudoLog.imageUrl);
        });
      });
    }
  }

  ngOnDestroy() {
    this.accountService.searchForHelper = "";
  }
}
