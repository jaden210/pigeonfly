import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

@Component({
  selector: "app-map-dialog",
  template: `
  <h2 mat-dialog-title>{{article.name}}</h2>
  <mat-dialog-content><div [innerHtml]="article.content"></div></mat-dialog-content>
  `
})
export class PreviewDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public article: any
  ) {}
}
