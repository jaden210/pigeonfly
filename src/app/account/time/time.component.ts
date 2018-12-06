import { Component, OnInit, OnDestroy } from "@angular/core";
import { trigger, style, transition, animate } from "@angular/animations";
import { AccountService, User } from "../account.service";
import * as moment from "moment";
import { TimeService, Timeclock, Event } from "./time.service";
import { DatePipe } from "@angular/common";
import { MatDialog } from "@angular/material";
import { PeopleDialogComponent } from "../people-dialog.component";
import { CreateEditShiftDialog } from "./create-edit-shift/create-edit-shift.dialog";

@Component({
  selector: "app-time",
  templateUrl: "./time.component.html",
  styleUrls: ["./time.component.css"],
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
export class TimeComponent implements OnInit, OnDestroy {
  private teamId: string;
  public searchStr: string; // template variable
  public searchVisible: boolean = true;
  private filterUsers: string[] = [];
  private timeClocks: Timeclock[] = [];
  public days: Day[] = [];
  public aDayId: number;
  public now: string = moment().format("MMM");

  constructor(
    private accountService: AccountService,
    private datePipe: DatePipe,
    private timeService: TimeService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.accountService.helper = this.accountService.helperProfiles.time;
    this.accountService.teamUsersObservable.subscribe(users => {
      if (users) {
        this.teamId = this.accountService.aTeam.id;
        this.getTimeclocks();
      }
    });
  }

  private getTimeclocks(): void {
    this.timeService.getTimeclocks(this.teamId).subscribe(clocks => {
      if (clocks.length == 0 && this.timeClocks.length > 0) return;
      this.timeClocks = clocks;
      if (this.timeClocks.length == 0) {
        this.accountService.showHelper = true;
        return;
      }
      this.buildCalendar();
    });
  }

  private buildCalendar(): void {
    this.days = [];
    const now = new Date();
    const totalDays = moment(now).diff(
      moment(this.timeService.backTillDate),
      "days"
    );
    for (let i = 0; i <= totalDays; i++) {
      let date = moment().subtract(i, "days");
      let month = date.format("MMMM");
      let day = date.format("DD");
      let dOW = date.format("ddd");
      let shiftsByUser = this.getShiftsByUserByDate(date);
      this.days.push({
        id: i + 1,
        date,
        month,
        day,
        dOW,
        shiftsByUser
      });
    }
  }

  private getShiftsByUserByDate(date): ShiftsByUser[] {
    let shiftsByPeople = {};
    this.timeClocks.forEach(shift => {
      if (moment(shift.shiftStarted).isSame(date, "day")) {
        if (shiftsByPeople[shift.userId]) {
          shiftsByPeople[shift.userId].shifts.push(shift);
        } else
          shiftsByPeople[shift.userId] = {
            shifts: [shift],
            totalSecondsWorked: shift.secondsWorked
          };
        if (!shift.shiftEnded) shiftsByPeople[shift.userId].badShift = true;
        shiftsByPeople[shift.userId].totalSecondsWorked += shift.secondsWorked;
      }
    });
    return Object.keys(shiftsByPeople).map(userId => {
      let user = this.getEmployee(userId);
      const tsw = shiftsByPeople[userId].totalSecondsWorked;
      let daysLoggedMinutes = Math.ceil((tsw % 3600) / 60);
      let daysLoggedHours = Math.floor(tsw / 3600);
      let badShift = shiftsByPeople[userId].badShift;
      return {
        user,
        shifts: shiftsByPeople[userId].shifts,
        daysLoggedMinutes,
        daysLoggedHours,
        badShift
      };
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

  private getEmployee(userId): any {
    return this.accountService.teamUsers.find(user => user.id == userId);
  }

  public createShift(date?: moment.Moment, userId?): void {
    let shift = new Timeclock();
    shift.userId = userId;
    shift.shiftStarted = date ? date.toDate() : new Date();
    shift.shiftEnded = date ? date.toDate() : new Date();
    let dialog = this.dialog.open(CreateEditShiftDialog, {
      data: shift,
      disableClose: true
    });
    dialog.afterClosed().subscribe((shift: Timeclock) => {
      if (shift) this.getTimeclocks();
    });
  }

  public editShift(shift: Timeclock): void {
    this.dialog.open(CreateEditShiftDialog, {
      data: shift,
      disableClose: true
    });
  }

  public loadMore(): void {
    let date = this.timeService.backTillDate;
    this.timeService.backTillDate = new Date(date.setDate(date.getDate() - 14));
    this.getTimeclocks();
  }

  public exportCSV(): void {
    this.downloadCSV(
      { filename: `timelog- ${this.Date} + .csv` },
      this.timeClocks[0]
    );
  }

  private get Date(): string {
    const date = new Date();
    let mm = date.getMonth() + 1;
    let dd = date.getDate();
    let yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  }

  convertOrderHeaderToCSV(args) {
    let keys = [
      { columnName: "Company Name Here", value: null },
      { columnName: "Date Range", value: "07/27/2018 - 08/04/2018" },
      { columnName: "Payroll Export", value: null }
    ];
    let result, columnDelimiter, lineDelimiter;
    columnDelimiter = args.columnDelimiter || ",";
    lineDelimiter = args.lineDelimiter || "\n";
    result = "";
    keys.forEach(key => {
      result += key.columnName;
      result += columnDelimiter;
      result += key.value;
      result += lineDelimiter;
    });
    result += lineDelimiter;
    return result;
  }

  convertOrderLinesToCSV(args, logs) {
    let map = [
      { key: "userName", columnName: "Employee" },
      { key: "date", columnName: "Date" },
      { key: "clockIn", columnName: "Clock-In" },
      { key: "clockOut", columnName: "Clock-Out" },
      { key: "hours", columnName: "Hours" }
    ];
    logs = logs.map(log => {
      return {
        ...log,
        userName: log.user.name,
        date: this.datePipe.transform(log.clockIn, "MM/dd/yyyy"),
        clockIn: this.datePipe.transform(log.clockIn, "h:mm a"),
        clockOut: this.datePipe.transform(log.clockOut, "h:mm a"),
        hours: log.loggedHours + "." + log.loggedMinutes
      };
    });
    let result, headers, columnDelimiter, lineDelimiter;
    if (!logs) return null;
    columnDelimiter = args.columnDelimiter || ",";
    lineDelimiter = args.lineDelimiter || "\n";
    headers = "";
    map.forEach(col => {
      headers += col.columnName;
      headers += columnDelimiter;
    });
    result = "";
    result += headers;
    result += lineDelimiter;
    logs.forEach(log => {
      map.forEach(col => {
        result +=
          '"' + (log[col.key] || log[col.key] == 0 ? log[col.key] : "") + '"';
        result += columnDelimiter;
      });
      result += lineDelimiter;
    });
    return result;
  }

  downloadCSV(args, logs) {
    let data, filename, link;
    let csv = this.convertOrderHeaderToCSV({});
    csv += this.convertOrderLinesToCSV({}, logs);
    if (csv === null) return;
    filename = args.filename || "timelog.csv";
    if (!csv.match(/^data:text\/csv/i)) {
      csv = "data:text/csv;charset=utf-8," + csv;
    }
    data = encodeURI(csv);
    link = document.createElement("a");
    link.setAttribute("href", data);
    link.setAttribute("download", filename);
    link.click();
  }

  ngOnDestroy() {
    this.accountService.searchForHelper = "";
  }
}

class Day {
  id: number;
  date: moment.Moment;
  month: string;
  day: string;
  dOW: string;
  shiftsByUser: ShiftsByUser[];
}

class ShiftsByUser {
  user: User;
  shifts: Timeclock[];
  daysLoggedMinutes: number;
  daysLoggedHours: number;
  badShift: boolean;
  bShowDetails?: boolean;
}
