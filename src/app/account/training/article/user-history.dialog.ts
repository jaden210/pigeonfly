import { Component, Inject, OnInit } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Observable } from "rxjs";
import { TrainingService } from "../training.service";
import { Survey } from "../../surveys/survey/survey";
import { tap } from "rxjs/operators";

@Component({
  template: `
    <h1 mat-dialog-title>Training History</h1>
    <div mat-dialog-content>
      <p style="margin-top: 0; color: #757575">for {{data.user.name}}</p>
        <mat-list dense style="outline: none;">
            <mat-list-item *ngFor="let survey of surveys | async">
                <mat-icon matListIcon style="color: #4CAF50">check</mat-icon>
                <h3 matLine>Training received on {{survey.createdAt | date}} from {{survey.trainedBy}}</h3>
            </mat-list-item>
            <mat-list-item *ngIf="noTrainings">
              {{data.user.name}} has not participated in any trainings for this article
            </mat-list-item>
        </mat-list>
    </div>
    <div mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>DONE</button>
    </div>
    `
})
export class UserHistoryDialog implements OnInit {
  public surveys: Observable<Survey[]>;
  public noTrainings: boolean;
  public loading: boolean;

  constructor(
    private trainingService: TrainingService,
    public dialogRef: MatDialogRef<UserHistoryDialog>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit() {
    this.loading = true;
    this.surveys = this.trainingService
      .getTrainingHistoryForUserByArticle(
        this.data.user.id,
        this.data.teamId,
        this.data.articleId
      )
      .pipe(
        tap(surveys => {
          if (!surveys.length) this.noTrainings = true;
          this.loading = false;
        })
      );
  }
}
