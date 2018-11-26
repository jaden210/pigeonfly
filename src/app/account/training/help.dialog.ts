import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

@Component({
  template: `
    <div mat-dialog-content [innerHtml]="data"></div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>GOT IT</button>
    </div>
  `,
  styles: [
    `
      .example-radio-group {
        display: inline-flex;
        flex-direction: column;
        margin: 8px 0;
      }

      .example-radio-button {
        margin: 5px;
      }
    `
  ]
})
export class HelpDialog {
  constructor(
    public dialogRef: MatDialogRef<HelpDialog>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}
}
