import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Topic } from "../../training.service";
import { TopicsService } from "../topics.service";

@Component({
  templateUrl: "./topic-dialog.component.html",
  styleUrls: ["topic-dialog.component.css"]
})
export class TopicDialogComponent implements OnInit {
  public topic: Topic;
  public image: any;
  public isEdit: boolean;
  public errorMessage: string;
  public previewImg: any;
  public loading: boolean;

  constructor(
    public dialogRef: MatDialogRef<TopicDialogComponent>,
    private service: TopicsService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}

  ngOnInit() {
    this.topic = this.data.topic;
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
    this.loading = true;
    this.service.uploadImage(this.image).subscribe(imageUrl => {
      this.topic.imageUrl = imageUrl;
      this.service
        .createTopic(this.topic)
        .then(() => this.dialogRef.close(this.topic))
        .catch(() => {
          this.loading = false;
          this.errorMessage = `Error creating topic`;
        });
    });
  }

  public editTopic(): void {
    this.loading = true;
    if (this.topic.imageUrl) this.service.removeImage(this.topic.imageUrl);
    this.service.uploadImage(this.image).subscribe(imageUrl => {
      this.topic.imageUrl = imageUrl;
      this.service
        .editTopic(this.topic)
        .then(() => this.dialogRef.close(this.topic))
        .catch(() => {
          this.loading = false;
          this.errorMessage = `Error updating topic`;
        });
    });
  }

  public deleteTopic(): void {
    if (
      window.confirm(
        `Are you sure you want to delete topic ${this.topic.name}?`
      )
    ) {
      this.loading = true;
      if (this.topic.imageUrl) this.service.removeImage(this.topic.imageUrl);
      this.service
        .deleteTopic(this.topic)
        .then(() => this.dialogRef.close("deleted"))
        .catch(() => {
          this.loading = false;
          this.errorMessage = `Error deleting topic`;
        });
    }
  }

  public deleteImage(): void {
    this.image = undefined;
    this.previewImg = undefined;
  }
}
