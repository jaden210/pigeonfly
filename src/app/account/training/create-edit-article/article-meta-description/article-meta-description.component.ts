import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';


@Component({
  templateUrl: "./article-meta-description.component.html",
  styleUrls: ["./article-meta-description.component.css"]
})
export class ArticleMetaDescriptionDialog {
  constructor(
    public dialogRef: MatDialogRef<ArticleMetaDescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  close() {
    this.dialogRef.close(this.data);
  }
}