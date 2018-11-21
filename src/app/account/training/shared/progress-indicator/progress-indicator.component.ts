import { Component, Input, OnChanges } from "@angular/core";
import { MyContent } from "../../training.service";
import { MatDialog } from "@angular/material";
import { TrainingStatusDialog } from "../training-status.dialog";
import { Router } from "@angular/router";

@Component({
  selector: "progress-indicator",
  template: `
    <button
      mat-stroked-button
      id="current-btn"
      (click)="openDialog(); $event.stopPropagation()"
    >
      <mat-icon *ngIf="complianceLevel < 100; else: good" color="warn"
        >error_outline</mat-icon
      >
      <ng-template #good>
        <mat-icon id="good">check_circle_outline</mat-icon>
      </ng-template>
      {{ words }}
    </button>
  `,
  styles: [
    `
      #current-btn mat-icon {
        margin: -3px 4px 0 -7px;
      }

      #good {
        color: #4caf50;
      }
    `
  ]
})
export class ProgressIndicatorComponent implements OnChanges {
  @Input()
  myContent: MyContent;
  complianceLevel: number;
  words: string;

  constructor(private dialog: MatDialog, private router: Router) {}

  ngOnChanges() {
    if (this.myContent) {
      this.complianceLevel = this.myContent.complianceLevel || 0;
      const traineesCount =
        Object.keys(this.myContent.shouldReceiveTraining).length || 0;
      const needsTraining = this.myContent.needsTraining.length || 0;
      this.words =
        traineesCount - needsTraining + " / " + traineesCount + " compliant";
    }
  }

  public openDialog(): void {
    const srtObj = this.myContent.shouldReceiveTraining || {};
    const needsTraining = this.myContent.needsTraining;
    const dialogRef = this.dialog.open(TrainingStatusDialog, {
      data: { srtObj, needsTraining }
    });
    dialogRef.afterClosed().subscribe(showHistory => {
      if (showHistory) {
        this.router.navigate([
          "account/training/history",
          this.myContent.articleId
        ]);
      }
    });
  }
}
