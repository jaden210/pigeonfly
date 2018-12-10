import { Component, OnInit } from "@angular/core";
import { trigger, style, transition, animate } from "@angular/animations";
import { AccountService } from "../account.service";
import { map } from "rxjs/operators";
import * as jsPDF from "jspdf";
import { MatSnackBar } from "@angular/material";

@Component({
  selector: "app-incident-reports",
  templateUrl: "./incident-reports.component.html",
  styleUrls: ["./incident-reports.component.css"],
  animations: [
    trigger("report", [
      transition(":enter", [
        style({ transform: "translateY(100%)", opacity: 0 }),
        animate(
          "250ms ease-out",
          style({ transform: "translateY(0)", opacity: 1 })
        )
      ]),
      transition(":leave", [
        style({ transform: "translateY(0)", opacity: 1 }),
        animate(
          "250ms ease-in",
          style({ transform: "translateY(100%)", opacity: 0 })
        )
      ])
    ])
  ]
})
export class IncidentReportsComponent implements OnInit {
  incidentReports: any;
  assesmentTemplate;
  aReport: any = null;

  constructor(
    public accountService: AccountService,
    public snackbar: MatSnackBar
  ) {
    this.accountService.helper = this.accountService.helperProfiles.incidentReport;
    this.accountService.teamUsersObservable.subscribe(team => {
      if (team) {
        let assesmentCollection = this.accountService.db.collection(
          `team/${this.accountService.aTeam.id}/incident-report`,
          ref => ref.orderBy("createdAt", "desc")
        );
        assesmentCollection
          .snapshotChanges()
          .pipe(
            map(actions => {
              return actions.map(a => {
                let data: any = a.payload.doc.data();
                return {
                  ...data,
                  id: a.payload.doc.id,
                  createdAt: data["createdAt"].toDate()
                };
              });
            })
          )
          .subscribe(incidentReports => {
            if (incidentReports.length == 0)
              this.accountService.showHelper = true;
            this.incidentReports = incidentReports;
            incidentReports.forEach(report => {
              report.user = this.accountService.teamUsers.find(
                user => user.id == report.submittedBy
              );
            });
          });
      }
    });
  }

  ngOnInit() {}

  selectReport(assesment) {
    this.aReport = assesment;
    if (this.aReport.submittedBy) {
      this.accountService.db
        .collection(
          `team/${this.accountService.aTeam.id}/incident-report`,
          ref => ref.where("submittedBy", "==", this.aReport.submittedBy)
        )
        .valueChanges()
        .subscribe(allReports => {
          this.aReport.previousReports = allReports;
        });
    }
  }

  cancel() {
    this.aReport = null;
  }

  delete() {
    if (this.aReport.id) {
      // remove from db
      let snackbar = this.snackbar.open("deleting", "undo", {
        duration: 6000
      });
      snackbar.afterDismissed().subscribe(action => {
        if (!action.dismissedByAction) {
          this.accountService.db
            .doc(
              `team/${this.accountService.aTeam.id}/incident-report/${
                this.aReport.id
              }`
            )
            .delete()
            .then(() => (this.aReport = null));
        } else {
          this.aReport = null;
        }
      });
      snackbar.onAction().subscribe(action => {
        snackbar.dismiss();
      });
    }
  }

  export() {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "in",
      format: [8.5, 11]
    });

    doc.setFontSize(15);
    doc.setFont("courier", "bold");

    const type = this.aReport.type;
    const createdAt = this.aReport.createdAt.toString();

    const startOfPage = 0.75;
    const endOfPage = 10.25;
    const lineSpace = 0.2;
    const sectionGap = 0.05;
    const maxChars = 95;

    let x = 0.5;
    let y = startOfPage;

    doc.text(type, x, y);
    y += lineSpace;
    doc.text(createdAt, x, y);
    y += lineSpace + lineSpace + sectionGap;

    this.aReport.questions.forEach(function(item, index) {
      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      let buffer = item.description;
      let prefix = (index + 1 <= 9 ? " " : "") + (index + 1) + ". ";
      while (buffer.length > 0) {
        if (buffer.length <= maxChars) {
          doc.text(prefix + buffer, x, y);
          y += lineSpace;
          if (y > endOfPage) {
            doc.addPage();
            y = startOfPage;
          }
          buffer = "";
          prefix = "    ";
        } else {
          const lastChar = buffer.substring(0, maxChars).lastIndexOf(" ");
          if (lastChar === -1) {
            doc.text(prefix + buffer.substring(0, maxChars), x, y);
            buffer = buffer.substring(maxChars);
          } else {
            doc.text(prefix + buffer.substring(0, lastChar), x, y);
            buffer = buffer.substring(lastChar + 1);
          }
          prefix = "    ";
          y += lineSpace;
          if (y > endOfPage) {
            doc.addPage();
            y = startOfPage;
          }
        }
      }

      if (item.value.constructor === Array) {
        if (item.type == Type.photos) {
          item.value.forEach(function(value) {
            doc.addImage(value.imageUrl, "PNG", x, y, 3, 3);
            if (x === 0.5) {
              x = 3.75;
            } else {
              x = 0.5;
              y += 3 + lineSpace;
              if (y > endOfPage) {
                doc.addPage();
                y = startOfPage;
              }
            }
          });
          if (x === 3.75) {
            x = 0.5;
            y += 3 + lineSpace;
            if (y > endOfPage) {
              doc.addPage();
              y = startOfPage;
            }
          }
        }
      } else {
        buffer = item.value;
        doc.setFont("courier", "bold");
        while (buffer.length > 0) {
          if (buffer.length <= maxChars) {
            doc.text(prefix + buffer, x, y);
            y += lineSpace;
            y += lineSpace;
            if (y > endOfPage) {
              doc.addPage();
              y = startOfPage;
            }
            buffer = "";
          } else {
            const lastChar = buffer.substring(0, maxChars).lastIndexOf(" ");
            if (item.type == Type.signature) {
              doc.addImage(buffer, "PNG", x, y, 2, 1);
              y += 1;
              buffer = "";
            } else if (lastChar === -1) {
              doc.text(prefix + buffer.substring(0, maxChars), x, y);
              buffer = buffer.substring(maxChars);
            } else {
              doc.text(prefix + buffer.substring(0, lastChar), x, y);
              buffer = buffer.substring(lastChar + 1);
            }

            y += lineSpace;
            if (y > endOfPage) {
              doc.addPage();
              y = startOfPage;
            }
          }
        }
      }
      y += sectionGap;
      if (y > endOfPage) {
        doc.addPage();
        y = startOfPage;
      }
    });

    doc.save(`${this.aReport.type}.pdf`);
  }
}

export enum Type {
  signature = "signature",
  photos = "photos",
  radio = "radio",
  text = "text",
  date = "date"
}
