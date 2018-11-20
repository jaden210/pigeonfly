import { Component, Input, OnChanges } from "@angular/core";
import { MyContent } from "../../training.service";

@Component({
  selector: "progress-indicator",
  template: `
    <div
      [ngClass]="{
        warn: complianceLevel == 0,
        attention: complianceLevel > 0,
        good: complianceLevel == 100
      }"
    >
      {{ words }}
    </div>
  `,
  styles: [
    `
      div {
        border-radius: 16px;
        height: 32px;
        border: 1px solid #bdbdbd;
        white-space: nowrap;
        line-height: 32px;
        padding: 0 8px;
        color: #757575;
      }

      .warn {
        border: 1px solid #e53935;
      }

      .attention {
        border: 1px solid #ffb300;
      }

      .good {
        border: 1px solid #43a047;
      }
    `
  ]
})
export class ProgressIndicatorComponent implements OnChanges {
  @Input()
  myContent: MyContent;
  complianceLevel: number;
  words: string;

  constructor() {}

  ngOnChanges() {
    if (this.myContent) {
      this.complianceLevel = this.myContent.complianceLevel || 0;
      const traineesCount = Object.keys(this.myContent.trainees).length || 0;
      const needsTraining = this.myContent.needsTraining.length || 0;
      this.words =
        traineesCount - needsTraining + " / " + traineesCount + " compliant";
    }
  }
}
