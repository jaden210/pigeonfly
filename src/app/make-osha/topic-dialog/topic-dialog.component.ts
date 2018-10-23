import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { AngularFireStorage } from "angularfire2/storage";
import {
  catchError,
  flatMap,
  take,
  finalize,
  mergeMap,
  switchMap,
  takeLast
} from "rxjs/operators";
import { Observable, of, throwError } from "rxjs";
import { AngularFirestore } from "angularfire2/firestore";
import { UploadTaskSnapshot } from "angularfire2/storage/interfaces";

@Component({
  templateUrl: "./topic-dialog.component.html",
  styleUrls: ["topic-dialog.component.css"]
})
export class TopicDialogComponent implements OnInit {
  private image: any;
  private industryId: string;
  private oshaManual: string;
  public topic: Topic;
  public isEdit: boolean;
  public errorMessage: string;
  public previewImg: any;
  public loading: boolean;

  constructor(
    public dialogRef: MatDialogRef<TopicDialogComponent>,
    private storage: AngularFireStorage,
    public db: AngularFirestore,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  ngOnInit() {
    this.topic = this.data.topic;
    this.industryId = this.data.industryId;
    this.oshaManual = this.data.oshaManual;
    this.isEdit = this.topic.id ? true : false;
  }

  public getImage(): void {
    document.getElementById("image-input").click();
  }

  public setImage(event): void {
    // callback from view
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();
      reader.onload = (event: ProgressEvent) => {
        this.previewImg = (<FileReader>event.target).result;
      };
      reader.readAsDataURL(event.target.files[0]);
      this.image = event.target.files[0];
    } else {
      this.previewImg = undefined; // broken image
      this.image = undefined;
    }
  }

  public createTopic(): void {
    this.uploadImage().subscribe(imageUrl => {
      this.topic.imageUrl = imageUrl;
      this.db
        .collection(`${this.oshaManual}/${this.industryId}/topics`)
        .add({ ...this.topic })
        .then(
          document => this.dialogRef.close(document.id),
          error => {
            this.loading = false;
            console.error(
              `Error creating topic ${this.topic.name}`,
              this.topic,
              error
            );
            this.errorMessage = `Error creating topic`;
          }
        );
    });
  }

  public editTopic(): void {
    if (this.topic.imageUrl)
      this.storage.storage.refFromURL(this.topic.imageUrl).delete();
    this.uploadImage().subscribe(imageUrl => {
      this.topic.imageUrl = imageUrl;
      this.db
        .collection(`${this.oshaManual}/${this.industryId}/topics`)
        .doc(this.topic.id)
        .update({ ...this.topic })
        .then(
          () => this.dialogRef.close(this.topic.id),
          error => {
            this.loading = false;
            console.error(
              `Error updating topic ${this.topic.name}`,
              this.topic,
              error
            );
            this.errorMessage = `Error updating topic`;
          }
        );
    });
  }

  public deleteTopic(): void {
    if (
      window.confirm(
        `Are you sure you want to delete topic ${this.topic.name}?`
      )
    ) {
      if (this.topic.imageUrl)
        this.storage.storage.refFromURL(this.topic.imageUrl).delete();
      this.db
        .collection(`${this.oshaManual}/${this.industryId}/topics`)
        .doc(this.topic.id)
        .delete()
        .then(
          () => this.dialogRef.close("deleted"),
          error => {
            this.loading = false;
            console.error(
              `Error deleting topic ${this.topic.name}`,
              this.topic,
              error
            );
            this.errorMessage = `Error deleting topic`;
          }
        );
    }
  }

  private uploadImage(): Observable<string> {
    this.loading = true;
    if (this.image) {
      let filePath = `${this.oshaManual}/${this.industryId}/topicImage/${
        this.topic.name
      }`;
      let ref = this.storage.ref(filePath);
      let task = this.storage.upload(filePath, this.image);
      return task.snapshotChanges().pipe(
        takeLast(1),
        flatMap(() => ref.getDownloadURL()),
        catchError(error => {
          console.error(
            `Error saving image for topic ${this.topic.name}`,
            this.topic,
            error
          );
          this.errorMessage = `Error saving image`;
          return throwError(error);
        })
      );
    } else return of(null);
  }

  public deleteImage(): void {
    this.image = undefined;
    this.previewImg = undefined;
  }
}

export class Topic {
  name: string;
  imageUrl: string;
  id?: string;
}
