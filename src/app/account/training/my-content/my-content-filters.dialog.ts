import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

@Component({
  template: `
    <h1 mat-dialog-title>Filter My Content</h1>
    <div mat-dialog-content>
      <mat-radio-group
        class="example-radio-group"
        [(ngModel)]="data.complianceType"
      >
        <mat-radio-button class="example-radio-button" [value]="'inCompliance'">
          Training articles in compliance
        </mat-radio-button>
        <mat-radio-button
          class="example-radio-button"
          [value]="'outOfCompliance'"
        >
          Training articles out of compliance
        </mat-radio-button>
      </mat-radio-group>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>CANCEL</button>
      <button mat-button (click)="clear()">CLEAR</button>
      <button mat-button (click)="save()" color="primary">APPLY</button>
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
export class MyContentFiltersDialog {
  constructor(
    public dialogRef: MatDialogRef<MyContentFiltersDialog>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  clear(): void {
    this.data.complianceType = null;
  }

  save(): void {
    this.dialogRef.close(this.data);
  }
}
