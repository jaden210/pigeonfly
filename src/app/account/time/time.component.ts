import { Component, OnInit, ViewChild, Inject, HostListener } from "@angular/core";
import { trigger, style, transition, animate } from "@angular/animations";
import { Timeclock, AccountService } from "../account.service";
import * as moment from "moment";
import { TimeService } from "./time.service";
import { DatePipe, Time } from "@angular/common";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material";
import { finalize } from "rxjs/operators";

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


  now: any = moment().format('MMM');

  constructor(
    public accountService: AccountService,
    private datePipe: DatePipe,
    private timeService: TimeService,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    /// NOTE: MAYBE CHANGE SO A USER ONLY SHOWS ONCE FOR A DAY AND EXPANDING SHOWS ALL INS AND OUTS
    this.accountService.helper = this.accountService.helperProfiles.time;
    this.accountService.teamUsersObservable.subscribe(aTeam => {
      if (aTeam) this.getLogs();
    });
  }

  private getLogs(): void {
    this.timeService
    .getTimeLogs(this.accountService.aTeam.id)
    .subscribe(logs => {
      if (logs.length == 0) return;
      this.timeClocks = this.timeClocks.concat(logs);
      this.timeService.lastLog = logs[logs.length - 1];
      if (this.timeClocks.length == 0) {
        this.accountService.showHelper = true;
        return;
      }
      this.buildCalendar();
      this.onScroll();
    });
  }

  @HostListener('scroll', ['$event'])
  onScroll(event?: any) {
    if (!event) {
      if (document.getElementById('body').clientHeight < document.getElementById('window').clientHeight) this.getLogs(); // if there isn't enough results to pass the fold, load more
      return;
    }
    if (event.target.offsetHeight + event.target.scrollTop >= event.target.scrollHeight) {
      this.getLogs();
    }
  }
  
  private buildCalendar(): void {
    this.days = [];
    let now: any = new Date();
    let total_days = moment(now).diff(this.timeClocks[this.timeClocks.length -1].clockIn, 'days');
    for (let i = 0; i <= total_days; i++) {
      let date = moment().subtract(i, "days");
      let month = date.format("MMM");
      let day = date.format("DD");
      let dOW = date.format("ddd");
      let timeClocks = this.getClocksByDate(date, this.timeClocks);
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

  getDiff(time) {
    let ci = moment(time.clockIn);
    let co = moment(time.clockOut);
    let duration: any = moment.duration(co.diff(ci));
    let lh = parseInt(duration.asHours());
    let lm = parseInt(duration.asMinutes())%60;
    return lh + 'h ' + lm + 'm';
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

  createEditTime(day, time?) {
    if (!time) {
      time = new Timeclock();
      time.clockIn = day.date;
      time.clockOut = day.date;
    }
    let dialog = this.dialog.open(CreateEditTimeDialog, {
      data: time,
      disableClose: true
    });
    dialog.afterClosed().subscribe((time: Timeclock) => {
      if (time) {
        let tempUser = time['user'];
        delete time['bShowDetails'];
        delete time['querySelectorId'];
        delete time['user'];
        delete time['loggedHours'];
        delete time['loggedMinutes'];
        time.updatedAt = new Date();
        time.updatedBy = this.accountService.user.name;
        time.updatedId = this.accountService.user.id;
        if (time.id) {
          this.accountService.db.collection('timeclock').doc(time.id).update({...time}).then(() => {
            time['user'] = tempUser;
            this.createEvent(time, "Edited a Timeclock")
          });
        } else {
          time.teamId = this.accountService.aTeam.id;
          this.accountService.db.collection('timeclock').add({...time}).then(snapshot => {
            time.id = snapshot.id;
            this.createEvent(time, "Created a Timeclock");
            this.buildCalendar();
          });
        }
      }
    })
  }

  createEvent(time, type) {
    this.accountService.createEvent(
      "timeclock",
      time.id,
      this.accountService.user.id,
      type,
      this.accountService.aTeam.id
    );
  }
}

@Component({
  selector: 'create-edit-time-dialog',
  templateUrl: 'create-edit-time-dialog.html',
  styleUrls: ['./time.component.css']
})
export class CreateEditTimeDialog {

  clockInHour;
  clockInMinute;
  clockOutHour;
  clockOutMinute;
  hours = [
    {name: '1 AM', value: '1'},
    {name: '2 AM', value: '2'},
    {name: '3 AM', value: '3'},
    {name: '4 AM', value: '4'},
    {name: '5 AM', value: '5'},
    {name: '6 AM', value: '6'},
    {name: '7 AM', value: '7'},
    {name: '8 AM', value: '8'},
    {name: '9 AM', value: '9'},
    {name: '10 AM', value: '10'},
    {name: '11 AM', value: '11'},
    {name: '12 PM', value: '12'},
    {name: '1 PM', value: '13'},
    {name: '2 PM', value: '14'},
    {name: '3 PM', value: '15'},
    {name: '4 PM', value: '16'},
    {name: '5 PM', value: '17'},
    {name: '6 PM', value: '18'},
    {name: '7 PM', value: '19'},
    {name: '8 PM', value: '20'},
    {name: '9 PM', value: '21'},
    {name: '10 PM', value: '22'},
    {name: '11 PM', value: '23'},
    {name: '12 AM', value: '24'}
  ];
  minutes = [
    '01', '02', '03', '04', '05', '06', '07', '08', '09',
    '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
    '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
    '30', '31', '32', '33', '34', '35', '36', '37', '38', '39',
    '40', '41', '42', '43', '44', '45', '46', '47', '48', '49',
    '50', '51', '52', '53', '54', '55', '56', '57', '58', '59'
  ]
  
  constructor(
    public dialogRef: MatDialogRef<CreateEditTimeDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,public accountService: AccountService) {
      this.clockInHour = moment(this.data.clockIn).format('HH').toString();
      this.clockInMinute = moment(this.data.clockIn).format('mm').toString();
      this.clockOutHour = moment(this.data.clockOut).format('HH').toString();
      this.clockOutMinute = moment(this.data.clockOut).format('mm').toString();
    }
    
    close(time?): void {
      this.data.clockIn = moment(this.data.clockIn).set('hour',+this.clockInHour).set('minute',+this.clockInMinute).toDate();
      this.data.clockOut = moment(this.data.clockOut).set('hour',+this.clockOutHour).set('minute',+this.clockOutMinute).toDate();
      this.dialogRef.close(time);
    }

    delete() {
      this.accountService.db.collection("timeclock").doc(this.data.id).delete().then(() => {
        this.accountService.createEvent(
          "timeclock",
          this.data.id,
          this.accountService.user.id,
          "Deleted a Timeclock",
          this.accountService.aTeam.id
        );
        this.dialogRef.close();
      });
    }
    
  }