import { Component, OnInit } from '@angular/core';
import { trigger, style, transition, animate } from "@angular/animations";
import { AccountService } from '../account.service';
import { map } from 'rxjs/operators';
import * as jsPDF from 'jspdf';

@Component({
  selector: 'app-incident-reports',
  templateUrl: './incident-reports.component.html',
  styleUrls: ['./incident-reports.component.css'],
  animations: [
    trigger("report", [
      transition(":enter", [
        style({ transform: "translateY(100%)", opacity: 0 }),
        animate("250ms ease-out", style({ transform: "translateY(0)", opacity: 1 }))
      ]),
      transition(":leave", [
        style({ transform: "translateY(0)", opacity: 1 }),
        animate("250ms ease-in", style({ transform: "translateY(100%)", opacity: 0 }))
      ])
    ])
  ]
})
export class IncidentReportsComponent implements OnInit {

  incidentReports: any;
  assesmentTemplate;
  aReport: any = null;

  constructor(
    public accountService: AccountService
  ) {
    this.accountService.helper = this.accountService.helperProfiles.osha;
    this.accountService.aTeamObservable.subscribe(team => {
      if (team) {
        let assesmentCollection = this.accountService.db.collection("incident-report", ref => ref.where("teamId", "==", this.accountService.aTeam.id).orderBy("createdAt", "desc"));
        assesmentCollection.snapshotChanges().pipe(
          map(actions => {
            return actions.map(a => {
              let data:any = a.payload.doc.data();
              return {
                ...data,
                id: a.payload.doc.id,
                createdAt: data["createdAt"].toDate()
              };
            });
          })
        ).subscribe(incidentReports => {
          if (incidentReports.length == 0) this.accountService.showHelper = true;
          this.incidentReports = incidentReports;
        });
      }
    });
  }
  
  ngOnInit() {
  }
  
  selectReport(assesment) {
    this.aReport = assesment;
  }

  cancel() {
    this.aReport = null;
  }

  export() {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [8.5, 11]
    });

    doc.setFont('courier');
    doc.setFontSize(9);

    const type = this.aReport.type;
    const reportName = this.aReport.reportName;
    const createdAt = this.aReport.createdAt.toString();

    const startOfPage = 0.75;
    const endOfPage = 10.25;
    const lineSpace = 0.2;
    const sectionGap = 0.05;
    const maxChars = 95;

    const x = 0.5;
    let y = startOfPage;

    doc.text(type, x, y);
    y += lineSpace;
    doc.text(reportName, x, y);
    y += lineSpace;
    doc.text(createdAt, x, y);
    y += (lineSpace + lineSpace + sectionGap);

    this.aReport.questions.forEach(function(item, index) {
      let buffer = item.description;
      let prefix = (index + 1 <= 9 ? ' ' : '') + (index + 1) + '. ';
      while (buffer.length > 0) {
        if (buffer.length <= maxChars) {
          doc.text(prefix + buffer, x, y);
          y += lineSpace;
          if (y > endOfPage) {
            doc.addPage();
            y = startOfPage;
          }
          buffer = '';
          prefix = '    ';
        } else {
          const lastChar = buffer.substring(0, maxChars).lastIndexOf(' ');
          doc.text(prefix + buffer.substring(0, lastChar), x, y);
          y += lineSpace;
          if (y > endOfPage) {
            doc.addPage();
            y = startOfPage;
          }
          buffer = buffer.substring(lastChar + 1);
          prefix = '    ';
        }
      }

      buffer = item.value;
      while (buffer.length > 0) {
        if (buffer.length <= maxChars) {
          doc.text(prefix + buffer, x, y);
          y += lineSpace;
          if (y > endOfPage) {
            doc.addPage();
            y = startOfPage;
          }
          buffer = '';
        } else {
          const lastChar = buffer.substring(0, maxChars).lastIndexOf(' ');
          doc.text(prefix + buffer.substring(0, lastChar), x, y);
          y += lineSpace;
          if (y > endOfPage) {
            doc.addPage();
            y = startOfPage;
          }
          buffer = buffer.substring(lastChar + 1);
        }
      }
      y += sectionGap;
      if (y > endOfPage) {
            doc.addPage();
            y = startOfPage;
      }
    });

    doc.save('incident.pdf');
  }
}
