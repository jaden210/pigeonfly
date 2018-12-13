import { Component, OnInit, OnDestroy } from "@angular/core";
import { trigger, style, transition, animate } from "@angular/animations";
import { AccountService, User } from "../account.service";
import * as moment from "moment";
import { TimeService, Timeclock } from "./time.service";
import { DatePipe } from "@angular/common";
import { MatDialog } from "@angular/material";
import { SearchDialog, SearchParams } from "./search-dialog/search.dialog";
import { CreateEditShiftDialog } from "./create-edit-shift/create-edit-shift.dialog";
import { Observable } from "rxjs";

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
  private searchParams: SearchParams;
  public isFiltered: boolean;
  public searchStr: string; // template variable
  public searchVisible: boolean = true;
  public filterUsers: string[] = [];
  private shifts: Timeclock[] = [];
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
    this.searchParams = new SearchParams();
    this.accountService.helper = this.accountService.helperProfiles.time;
    this.accountService.teamUsersObservable.subscribe(users => {
      if (users) {
        this.teamId = this.accountService.aTeam.id;
        this.getShifts().subscribe(shifts => {
          if (!shifts.length) this.accountService.showHelper = true;
          this.shifts = this.filterShifts(shifts);
          this.buildCalendar();
        });
      }
    });
  }

  private getShifts(startDate?: Date, endDate?: Date): Observable<Timeclock[]> {
    startDate = startDate || this.searchParams.startDate;
    endDate = endDate || this.searchParams.endDate;
    return this.timeService.getTimeclocks(this.teamId, startDate, endDate);
  }

  private filterShifts(shifts: Timeclock[]): Timeclock[] {
    shifts = shifts || [];
    this.isFiltered = false;
    const params = this.searchParams || new SearchParams();
    if (params.employees.length) {
      this.isFiltered = true;
      return shifts.filter(tc => {
        for (let e of params.employees) {
          if (e.id != tc.userId) return false;
        }
      });
    } else {
      if (this.datePipe.transform(params.endDate) != this.datePipe.transform(new Date())) this.isFiltered = true;
      return shifts;
    }
  }

  private buildCalendar(): void {
    this.days = [];
    const endDate = this.searchParams.endDate;
    const totalDays = moment(endDate).diff(
      moment(this.searchParams.startDate),
      "days"
    );
    for (let i = 0; i <= totalDays; i++) {
      let date = moment(endDate).subtract(i, "days");
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

  private getShiftsByUserByDate(date: moment.Moment): ShiftsByUser[] {
    let shiftsByPeople = {};
    this.shifts.forEach(shift => {
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
          this.getShifts().subscribe(shifts => {
            this.shifts = this.filterShifts(shifts);
            this.buildCalendar();
          });
        }
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
      if (shift) this.getShifts();
    });
  }

  public editShift(shift: Timeclock): void {
    this.dialog.open(CreateEditShiftDialog, {
      data: shift,
      disableClose: true
    });
  }

  public loadMore(): void {
    let date = this.searchParams.startDate;
    this.searchParams.startDate = new Date(date.setDate(date.getDate() - 14));
    this.getShifts();
  }

  public exportCSV(): void {
    this.dialog
      .open(SearchDialog, {
        data: { searchParams: this.searchParams, isExport: true },
        disableClose: true
      })
      .afterClosed()
      .subscribe((params: SearchParams) => {
        if (params) {
          this.getShifts(params.startDate, params.endDate).subscribe(shifts =>
            this.downloadCSV(params.startDate, params.endDate, shifts)
          );
        }
      });
  }

  private get Date(): string {
    const date = new Date();
    let mm = date.getMonth() + 1;
    let dd = date.getDate();
    let yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  }

  private downloadCSV(startDate: Date, endDate: Date, shifts: Timeclock[]) {
    let data, filename, link;
    let csv = this.convertOrderHeaderToCSV(startDate, endDate);
    csv += this.convertOrderLinesToCSV(shifts);
    if (csv === null) return;
    filename = `timelog- ${this.Date} + .csv`;
    if (!csv.match(/^data:text\/csv/i)) {
      csv = "data:text/csv;charset=utf-8," + csv;
    }
    data = encodeURI(csv);
    link = document.createElement("a");
    link.setAttribute("href", data);
    link.setAttribute("download", filename);
    link.click();
  }

  convertOrderHeaderToCSV(startDate: Date, endDate: Date) {
    let keys = [
      this.accountService.aTeam.name,
      `${this.datePipe.transform(startDate)} - ${this.datePipe.transform(
        endDate
      )}`,
      "Payroll Export"
    ];
    let result, lineDelimiter;
    lineDelimiter = "\n";
    result = "";
    keys.forEach(key => {
      result += '"' + key + '"';
      result += lineDelimiter;
    });
    result += lineDelimiter;
    return result;
  }

  convertOrderLinesToCSV(shifts: Timeclock[]) {
    let map = [
      { key: "employee", columnName: "Employee" },
      { key: "shiftStarted", columnName: "Shift Started" },
      { key: "shiftEnded", columnName: "Shift Ended" },
      { key: "hoursOnBreak", columnName: "Hours on Break" },
      { key: "hoursWorked", columnName: "Hours Worked" }
    ];
    const lines = shifts
      .map(s => {
        if (!s.secondsWorked) this.timeService.setSecondsWorked(s);
        let employee = this.getEmployee(s.userId);
        employee = employee ? employee.name : null;
        const shiftEnded = s.shiftEnded
          ? this.datePipe.transform(s.shiftEnded, "yyyy-MM-dd HH:mm")
          : null;
        const shiftStarted = s.shiftStarted
          ? this.datePipe.transform(s.shiftStarted, "yyyy-MM-dd HH:mm")
          : null;
        const hoursWorked = (s.secondsWorked / 3600).toFixed(2);
        const startToEnd =
          moment(s.shiftEnded || undefined).diff(
            moment(s.shiftStarted || undefined),
            "seconds"
          ) || 0;
        const hoursOnBreak = ((startToEnd - s.secondsWorked) / 3600).toFixed(2);
        return {
          employee,
          shiftStarted,
          shiftEnded,
          hoursOnBreak,
          hoursWorked
        };
      })
      .filter(s => s.shiftStarted && s.shiftEnded && s.employee);
    let result, headers, columnDelimiter, lineDelimiter;
    if (!lines) return null;
    columnDelimiter = ",";
    lineDelimiter = "\n";
    headers = "";
    map.forEach(col => {
      headers += col.columnName;
      headers += columnDelimiter;
    });
    result = "";
    result += headers;
    result += lineDelimiter;
    lines.forEach(log => {
      map.forEach(col => {
        result +=
          '"' + (log[col.key] || log[col.key] == 0 ? log[col.key] : "") + '"';
        result += columnDelimiter;
      });
      result += lineDelimiter;
    });
    return result;
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
