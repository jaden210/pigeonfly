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

    doc.setFontSize(10);

    const type = this.aReport.type;
    const reportName = this.aReport.reportName;
    const createdAt = this.aReport.createdAt.toString();
    const x = 0.5;
    let y = 2;

    doc.text(type, x, 1);
    doc.text(reportName, x, 1.25);
    doc.text(createdAt, x, 1.5);

    this.aReport.questions.forEach(function(item, index) {
      doc.text((index + 1) + '. ' + item.description, x, y);
      y += 0.25;
      doc.text(item.value, x, y);
      y += 0.25;
    });

    doc.save('incident.pdf');
  }

}
