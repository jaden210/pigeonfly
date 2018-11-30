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
import { MapDialogComponent } from "../map-dialog/map-dialog.component";
import { LogService } from "./log.service";
import { LogsFilterDialog } from "./filter-dialog/filter.dialog";

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
  ],
  providers: [LogService]
})
export class LogComponent implements OnDestroy {
  searchStr: string; // template variable
  searchVisible: boolean = true;
  filterUsers: string[] = [];

  days = [];
  calendarDays = [];
  lastLength = 50;

  now: any = moment().format("MMM");

  constructor(public accountService: AccountService, public dialog: MatDialog, private logService: LogService) {
    this.accountService.helper = this.accountService.helperProfiles.log;
    this.accountService.teamUsersObservable.subscribe(aTeam => {
      if (aTeam) {
        this.getLogs();
      }
    });
  }

  getLogs() {
    this.logService.limit = this.logService.limit + 50; // bump results for pagination
    this.searchStr = this.accountService.searchForHelper; //sucks
    this.logService.getLogs().subscribe(logs => {
      if (logs.length == 0) { // no logs yet
        this.accountService.showHelper = true;
        return;
      }
      if (logs.length == this.lastLength) return; // no more from pagination
      this.lastLength = logs.length;
      logs.forEach(log => {
        log.user = this.accountService.teamUsers.find(user => user.id == log.userId);
      });
      this.buildCalendar(logs);
    });
  }

  @HostListener("scroll", ["$event"])
  onScroll(event?: any) {
    if (!event) {
      if (document.getElementById('bbody').clientHeight < document.getElementById('window').clientHeight) {
        this.getLogs(); // if there isn't enough results to pass the fold, load more
        return;
      } 
    } else {
      if (event.target.offsetHeight + event.target.scrollTop + 1 >= event.target.scrollHeight) {
        this.getLogs();
      }
    }
  }

  buildCalendar(logs) {
    this.calendarDays = [];
    let now: any = new Date();
    let total_days = moment(now).diff(
      logs[logs.length - 1].createdAt,
      "days"
    );
    for (let i = 0; i <= total_days; i++) {
      let date = moment().subtract(i, "days");
      let month = date.format("MMM");
      let day = date.format("DD");
      let dOW = date.format("ddd");
      this.calendarDays.push({
        id: i + 1,
        date,
        month,
        day,
        dOW,
        logs: logs.filter(log => moment(log.createdAt).isSame(date, "day"))
      });
    }
    this.filterEvents();
    setTimeout(() => {
      this.onScroll();
    }, 1000);
  }

  showImages(images) {
    // TODO: Pass index so it opens to the right image when there are a bunch
    let dialog = this.dialog.open(ImagesDialogComponent, {
      data: images
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
        const user = log["user"];
        delete log["bShowDetails"];
        delete log["user"];
        if (log.id) {
          log.updatedAt = new Date();
          log.updatedBy = this.accountService.user.name;
          log.updatedId = this.accountService.user.id;
          this.accountService.db
            .collection(`team/${this.accountService.aTeam.id}/log`)
            .doc(log.id)
            .update({...log}).then(() => log["user"] = user);
        } else {
          log.createdAt = new Date(log.createdAt);
          log.teamId = this.accountService.aTeam.id;
          log.userId = this.accountService.user.id;
          this.accountService.db
            .collection(`team/${this.accountService.aTeam.id}/log`)
            .add({ ...log })
            .then(snapshot => {
              log.id = snapshot.id;
            });
        }
      }
    });
  }

  showMap(log) {
    this.dialog.open(MapDialogComponent, {
      data: {
        longPos: log.LongPos,
        latPos: log.LatPos
      }
    });
  }

  filter(): void {
    this.dialog.open(LogsFilterDialog, {
      data: {
        filterUsers: this.filterUsers
      },
      disableClose: true
    })
    .afterClosed()
    .subscribe((data) => {
      console.log(data);
      if (data) {
        this.filterUsers = data.filterUsers;
        console.log('hit');
        
        this.filterEvents();
      }
    });
  }

  filterEvents(): void {
    if (this.searchStr && this.searchStr != "" || this.filterUsers.length > 0) {
      let filter: string[] = [].concat(
        this.searchStr ? this.searchStr.trim().split(/\s+/) : [],
        this.filterUsers
      );
      let results = JSON.parse(JSON.stringify(this.calendarDays));
      this.days = results.filter(day => {
        day.logs = day.logs.filter((log: Log) => {
          let eventFiltersFound = 0;
          for (let f of filter) {
            console.log(log);
            
            log.description.toLowerCase().includes(f.toLowerCase()) ? eventFiltersFound ++ : null;
            log.id.toLowerCase().includes(f.toLowerCase()) ? eventFiltersFound ++ : null;
            log['user'].name.toLowerCase().includes(f.toLowerCase()) ? eventFiltersFound ++ : null;
          };
          return eventFiltersFound >= filter.length ?  true : false;
        });
        return day.logs.length;
      })
    } else this.days = this.calendarDays;
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
    @Inject(MAT_DIALOG_DATA) public data: Log,
    public accountService: AccountService
  ) {}

  close(log?): void {
    this.dialogRef.close(log);
  }

  delete() {
    this.accountService.db
      .collection(`team/${this.accountService.aTeam.id}/log`)
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
