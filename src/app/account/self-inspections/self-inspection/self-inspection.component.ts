import { Component } from "@angular/core";
import { SelfInspectionsService, Inspection } from "../self-inspections.service";
import { MatSnackBar } from "@angular/material";
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
  ) {
    if (!this.selfInspectionsService.selfInspection) {
      this.location.back();
      return;
    };
    this.selfInspectionsService.getInspections().subscribe(inspections => {
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

  leave() {
    this.location.back();
    this.selfInspectionsService.selfInspection = null;
  }

  getCompliantPercent(inspection): string {
    return (Math.round(inspection.compliantPercent*100))+'% compliant';
  }
  getCompletePercent(inspection): string {
    return (Math.round(inspection.completedPercent*100))+'% complete';
  }

  export(si: Inspection) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [8.5, 11]
    });
    doc.setFontSize(14);
    const startOfPage = 0.75;
    const endOfPage = 10.25;
    const lineSpace = 0.2;
    const maxChars = 95;
    const x = 0.5;
    let y = startOfPage;

    doc.text(this.selfInspectionsService.selfInspection.title, x, y);
    y += (1.5 * lineSpace);
    if (y > endOfPage) {
      doc.addPage();
      y = startOfPage;
    }

    doc.text(si.completedAt.toString(), x, y);
    y += lineSpace;
    if (y > endOfPage) {
      doc.addPage();
      y = startOfPage;
    }

    doc.setFont('courier');
    si.categories.forEach(category => {
      doc.setFontSize(12);
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

      doc.setFontSize(9);
      category.questions.forEach(question => {
        let buffer = question.name;
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

        if (question.answer === undefined) {
          doc.text('undefined', x, y);
        } else {
          doc.text(question.answer.valueOf() + " - " + question.comment, x, y);
        }
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
