import { Component, OnInit, ViewChild } from "@angular/core";
import { trigger, style, transition, animate } from "@angular/animations";
import { Timeclock, AccountService } from "../account.service";
import * as moment from "moment";
import { TimeService } from "./time.service";
import { DatePipe } from "@angular/common";

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
  ],
  providers: [TimeService]
})
export class TimeComponent implements OnInit {
  searchStr; // template variable
  filterUsers; // template variable

  timeClocks: any = [];
  days = [];

  lat: number;
  long: number;

  constructor(
    public accountService: AccountService,
    private datePipe: DatePipe,
    private timeService: TimeService
  ) {}

  ngOnInit() {
    this.accountService.helper = this.accountService.helperProfiles.time;
    const fortnightAgo = new Date(Date.now() - 12096e5);
    this.accountService.aTeamObservable.subscribe(aTeam => {
      if (aTeam) this.getLogs(fortnightAgo, new Date());
    });
  }

  private getLogs(startDate: Date, endDate: Date): void {
    this.timeService
      .getTimeLogs(this.accountService.aTeam.id, startDate, endDate)
      .subscribe(logs => {
         if (logs.length == 0) this.accountService.showHelper = true;
         this.timeClocks.push(logs);
         this.buildCalendar(logs);
      });
  }

  private buildCalendar(logs: any[]): void {
    let now: any = new Date();
    let total_days = Math.round(
      (now - logs[logs.length - 1].clockIn) / (1000 * 60 * 60 * 24)
    ); //moment equilivant?
    for (let i = 0; i <= total_days; i++) {
      let date = moment().subtract(i, "days");
      let month = date.format("MMM");
      let day = date.format("DD");
      let dOW = date.format("ddd");
      let timeClocks = this.getClocksByDate(date, logs);
      this.days.push({
        id: i + 1,
        date,
        month,
        day,
        dOW,
        loggedHours: timeClocks.loggedHours,
        loggedMinutes: timeClocks.loggedMinutes,
        timeLogs: timeClocks.logs,
        loggers: timeClocks.loggers
      });
    }
  }

  getClocksByDate(date, logs) {
    let loggedHours = 0;
    let loggedMinutes = 0;
    let users = [];
    let timeClocksOnDate: Timeclock[] = logs.filter(day =>
      moment(day.clockIn).isSame(date, "day")
    );
    timeClocksOnDate.forEach((day: Timeclock) => {
      let ci = moment(day.clockIn);
      let co = moment(day.clockOut);
      let duration: any = moment.duration(co.diff(ci));
      day.loggedHours = parseInt(duration.asHours());
      day.loggedMinutes = (parseInt(duration.asMinutes()) % 60);
      loggedHours = loggedHours + parseInt(duration.asHours());
      loggedMinutes = loggedMinutes + (parseInt(duration.asMinutes()) % 60);
      if (loggedMinutes > 60) {
        loggedMinutes = loggedMinutes - 60;
        loggedHours = loggedHours + 1;
      }
      if (!users.find(user => user.id == day.userId)) {
        users.push(
          this.accountService.teamUsers.find(user => user.id == day.userId)
        );
      }
    });
    return {
      loggedHours,
      loggedMinutes,
      logs: timeClocksOnDate,
      loggers: users
    };
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
}
