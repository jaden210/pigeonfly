import { Component } from "@angular/core";
import { SelfInspectionsService, Inspection, DeleteInspectionDialog, ExperationTimeFrame } from "../self-inspections.service";
import { MatSnackBar, MatDialog } from "@angular/material";
import { ActivatedRoute, Router } from "@angular/router";
import * as jsPDF from 'jspdf';
import { Location } from "@angular/common";

@Component({
  selector: "app-self-inspection",
  templateUrl: "./self-inspection.component.html",
  styleUrls: ["./self-inspection.component.css"]
})
export class SelfInspectionComponent {

  inProgressInspections: Inspection[] = [];
  completedInspections: Inspection[] = [];

  constructor(
    public selfInspectionsService: SelfInspectionsService,
    private snackbar: MatSnackBar,
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog
  ) {
    if (!this.selfInspectionsService.selfInspection) {
      this.location.back();
      return;
    };
    this.selfInspectionsService.getInspections().subscribe(inspections => {
      this.selfInspectionsService.selfInspectionInspections = inspections;
      this.inProgressInspections = [];
      this.completedInspections = [];
      inspections.forEach(inspection => {
        if (inspection.completedAt) {
          this.completedInspections.push(inspection);
        } else {
          this.inProgressInspections.push(inspection);
        }
      });
    })
  }

  startSelfInspection() {
    this.selfInspectionsService.startInspection().then(inspection => {
      this.resumeSelfInspection(inspection);
    });
  }
  
  resumeSelfInspection(inspection) {
    this.selfInspectionsService.takeInspection = inspection;
    this.router.navigate([inspection.createdAt.toLocaleTimeString()], {relativeTo: this.route});
  }

  editSelfInspection() {
    this.router.navigate(['edit'], {relativeTo: this.route});
  }

  deleteSelfInspection() {
    let dialog = this.dialog.open(DeleteInspectionDialog);
    dialog.afterClosed().subscribe(bDelete => {
      if (bDelete) {
        this.selfInspectionsService.deleteSelfInspection().then(() => {
          this.leave();
        })
        .catch(error => {
          let snackbar = this.snackbar.open("error deleting Self Inspection...", null, {
            duration: 3000
          });
          console.log(error);
        });
      }
    })
  }

  leave() {
    this.location.back();
    this.selfInspectionsService.selfInspection = null;
  }

  export(si: Inspection) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [8.5, 11]
    });
    const startOfPage = 0.75;
    const endOfPage = 10.25;
    const lineSpace = 0.2;
    const maxChars = 95;
    const x = 0.5;
    let y = startOfPage;
    
    doc.setFontSize(15);
    doc.setFont("courier", "bold");
    doc.text(this.selfInspectionsService.selfInspection.title, x, y);
    y += (1.5 * lineSpace);
    doc.text(si.completedAt.toString(), x, y);
    y += lineSpace;
    doc.setFont('courier', "normal");
    si.categories.forEach(category => {
      doc.setFontSize(13);
      y += (1.5 * lineSpace);
      if (y > endOfPage) {
        doc.addPage();
        y = startOfPage;
      }
      
      doc.text(category.subject, x, y);
      y += (1.5 * lineSpace);
      if (y > endOfPage) {
        doc.addPage();
        y = startOfPage;
      }
      
      category.questions.forEach(question => {
        doc.setFontSize(9);
        let buffer = question.name;
        doc.setFont('courier', "normal");
        while (buffer.length > 0) {
          if (buffer.length <= maxChars) {
            doc.text(buffer, x, y);
            y += lineSpace;
            if (y > endOfPage) {
              doc.addPage();
              y = startOfPage;
            }
            buffer = '';
          } else {
            const lastChar = buffer.substring(0, maxChars).lastIndexOf(' ');
            if (lastChar === -1) {
              doc.text(buffer.substring(0, maxChars), x, y);
              buffer = buffer.substring(maxChars);
            } else {
              doc.text(buffer.substring(0, lastChar), x, y);
              buffer = buffer.substring(lastChar + 1);
            }
            y += lineSpace;
            if (y > endOfPage) {
              doc.addPage();
              y = startOfPage;
            }
          }
        }
        y += lineSpace;
        if (y > endOfPage) {
          doc.addPage();
          y = startOfPage;
        }
        doc.setFontSize(12);
        if (question.answer === undefined) {
          doc.text('No answer given', x, y);
        } else {
          doc.setFont("courier", "bold");
          if (!question.answer) {
            doc.setTextColor("#ff5252");
          }
          doc.text(question.answer ? "YES" : "NO", x, y);y += lineSpace;
          doc.setTextColor("#000000");
          if (y > endOfPage) {
            doc.addPage();
            y = startOfPage;
          }
          if (question.comment) {
            let comment = question.comment;
            doc.setFontSize(8);
            while (comment.length > 0) {
              if (comment.length <= maxChars) {
                doc.text(comment, x, y);
                y += lineSpace;
                if (y > endOfPage) {
                  doc.addPage();
                  y = startOfPage;
                }
                comment = '';
              } else {
                const lastChar = comment.substring(0, maxChars).lastIndexOf(' ');
                if (lastChar === -1) {
                  doc.text(comment.substring(0, maxChars), x, y);
                  comment = comment.substring(maxChars);
                } else {
                  doc.text(comment.substring(0, lastChar), x, y);
                  comment = comment.substring(lastChar + 1);
                }
                y += lineSpace;
                if (y > endOfPage) {
                  doc.addPage();
                  y = startOfPage;
                }
              }
            }
          } 
        }
        y += lineSpace;
        y += lineSpace;
        y += lineSpace;
        if (y > endOfPage) {
          doc.addPage();
          y = startOfPage;
        }
      });
    });
    doc.save(`self-inspection ${this.selfInspectionsService.selfInspection.title}.pdf`);
  }
}
