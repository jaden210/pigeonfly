import { Component, OnInit, Pipe, Inject} from '@angular/core';
import { AccountService } from '../../account.service';
import { map, takeLast, flatMap, catchError } from "rxjs/operators";
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { DomSanitizer, SafeHtml, SafeStyle, SafeUrl, SafeScript, SafeResourceUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { StatsService } from '../stats.service';
import { AngularFireStorage } from '@angular/fire/storage';

@Component({
  selector: 'app-make-blog',
  templateUrl: './make-blog.component.html',
  styleUrls: ['./make-blog.component.css']
})
export class BlogComponent implements OnInit {

 
  collection: string = 'osha-assesment-template-en';
  list;
  listId;

  blog: Blog;
  topics: Observable<any>;

  loading: boolean = false;
  slugError: string;

  public editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: "calc(100vh - 360px)",
    minHeight: "100px",
    placeholder: "Content *",
    translate: "yes"
  };


  constructor(
    public accountService: AccountService,
    public dialog: MatDialog,
    private statsService: StatsService
  ) { }

  ngOnInit() {
    this.statsService.blog ? this.blog = this.statsService.blog : this.blog = new Blog();
    this.topics = this.accountService.db.collection("blog-topic").snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
          const data = a.payload.doc.data() as any;
          const id = a.payload.doc.id;
          return { id, ...data };
        })
      )
    )
  }

  submit() {
    this.slugError = '';
    if (this.blog.createdAt) { //edit
      this.accountService.db.doc(`blog/${this.blog.id}`).update({...this.blog}).then(() => {
        this.statsService.blog = new Blog();
        this.statsService.makeBlog = false;
      })
    } else {
      this.blog.id = this.blog.id ? this.blog.id.split(' ').join('-').toLowerCase() : this.blog.name.split(' ').join('-').toLowerCase();
      this.accountService.db.doc(`blog/${this.blog.id}`).valueChanges().subscribe(blog => {
        if (!blog) {
          this.blog.createdAt = new Date();
          this.accountService.db.collection("blog").doc(this.blog.id).set({...this.blog}).then(() => {
            this.statsService.blog = new Blog();
            this.statsService.makeBlog = false;
          }, error => console.error(error));
        } else {
          this.slugError = "That name is already taken";
        }
      })
    }
  }

  blogPhoto() {
    let dialog = this.dialog.open(BlogPhotoDialog, {
      data: this.blog
    });
    dialog.afterClosed().subscribe(data => {
      console.log(data);
      
    })
  }

  blogVideo() {
    let dialog = this.dialog.open(BlogVideoDialog, {
      data: this.blog
    });
    dialog.afterClosed().subscribe(data => {
      console.log(data);
      
    })
  }

  blogMetaDescription() {
    let dialog = this.dialog.open(BlogMetaDescriptionDialog, {
      data: this.blog
    });
    dialog.afterClosed().subscribe(data => {
      console.log(data);
      
    })
  }

  newTopic() {
    let dialog = this.dialog.open(BlogTopicDialog)
    dialog.afterClosed().subscribe(data => {
      if (data) {
        let blogTopic = {
          name: data.name,
          createdAt: new Date(),
        }
        let id = data.name.split(' ').join('-').toLowerCase();
        this.accountService.db.collection("blog-topic").add({...blogTopic}).then(() => {
          this.blog.topic = blogTopic.name;
        }, error => {
          console.error("Topic name is already created.");
          this.blog.topic = blogTopic.name;
        });
      }
    })
  }

  cancel() {
    this.statsService.blog = new Blog();
    this.statsService.makeBlog = false;
  }

}

@Component({
  selector: "app-topic-dialog",
  template: `
  <h2 mat-dialog-title>New Topic</h2>
  <mat-dialog-content>
  <mat-form-field>
    <input matInput placeholder="Topic Name" [(ngModel)]="topic.name">
  </mat-form-field>
  </mat-dialog-content>
  <mat-dialog-actions style="margin-top:12px" align="end"><button mat-button color="primary" style="margin-right:8px" (click)="dialogRef.close()">CANCEL</button>
  <button mat-raised-button color="accent" (click)="close(topic)">CREATE</button>
  </mat-dialog-actions>
  `
})
export class BlogTopicDialog {
  topic = new BlogTopic();
  constructor(
    public dialogRef: MatDialogRef<BlogTopicDialog>
  ) {}

  close(topic) {
    this.dialogRef.close(topic);
  }
}

@Component({
  selector: "app-topic-dialog",
  template: `
  <h2 mat-dialog-title>Meta Description</h2>
  <mat-dialog-content style="width:50vw">
  <mat-form-field style="width:100%">
    <textarea matInput rows="8" placeholder="description" [(ngModel)]="data.metaDescription"></textarea>
    <mat-hint [ngClass]="{red: data.metaDescription.length > 300}">{{data.metaDescription.length}}/300</mat-hint>
  </mat-form-field>
  </mat-dialog-content>
  <mat-dialog-actions style="margin-top:12px" align="end">
  <button mat-raised-button color="accent" (click)="close()">SET</button>
  </mat-dialog-actions>
  `,
  styleUrls: ['./make-blog.component.css']
})
export class BlogMetaDescriptionDialog {
  topic = new BlogTopic();
  constructor(
    public dialogRef: MatDialogRef<BlogMetaDescriptionDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  close() {
    this.dialogRef.close(this.data);
  }
}

@Component({
  selector: "app-topic-dialog",
  template: `
  <h2 mat-dialog-title>Blog Photo</h2>
  <mat-dialog-content>
    <div style="height: 0px; width: 0px; overflow:hidden">
      <input type="file" id="image-input" accept=".png, .jpg" (change)="setImage($event)"/>
    </div>
    <div class="card">
      <div class="img-cont">
        <img src={{previewImg}} onerror="src = '/assets/lost.png'">
        <button mat-icon-button color="primary" id="pbutton" (click)="getImage()"><mat-icon>add_a_photo</mat-icon></button>
      </div>
      <div class="title">{{data.name}}</div>
    </div>
  </mat-dialog-content>
  <mat-dialog-actions style="margin-top:12px" align="end"><button mat-button color="primary" style="margin-right:8px" (click)="dialogRef.close()">CANCEL</button>
  <button mat-raised-button color="accent" (click)="close()">CREATE</button>
  </mat-dialog-actions>
  `,
  styleUrls: ['./make-blog.component.css']
})
export class BlogPhotoDialog {
  topic = new BlogTopic();
  previewImg;
  image;

  constructor(
    public dialogRef: MatDialogRef<BlogPhotoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private storage: AngularFireStorage
  ) {
    this.previewImg = this.data.imageUrl || null;
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

  public uploadImage(): Observable<string> {
    const date = new Date().getTime();
    let filePath = `BlogImages/${date}`;
    let ref = this.storage.ref(filePath);
    let task = this.storage.upload(filePath, this.image);
    return task.snapshotChanges().pipe(
      takeLast(1),
      flatMap(() => ref.getDownloadURL()),
      catchError(error => {
        console.error(`Error saving image for topic`, error);
        return (error);
      })
    );
  }

  close() {
    this.uploadImage().subscribe(imageUrl => {
      this.data.imageUrl = imageUrl;
    })
    this.dialogRef.close(this.data);
  }
}

@Component({
  selector: "app-topic-dialog",
  template: `
  <h2 mat-dialog-title>Blog Video</h2>
  <mat-dialog-content style="display:flex;flex-direction:column; align-items:center;width:500px">
    <div style="height: 0px; width: 0px; overflow:hidden">
      <input type="file" id="image-input" accept=".mp4" (change)="setVideo($event)"/>
    </div>
    <button mat-icon-button color="primary" (click)="getVideo()"><mat-icon>video_call</mat-icon></button>
    <mat-progress-bar mode="determinate" [value]="(uploadProgress | async)" style="width:50%;"></mat-progress-bar>
    <mat-form-field style="margin-top:24px;width: 100%">
      <input matInput [(ngModel)]="data.videoUrl" placeholder="or video url">
    </mat-form-field>
  </mat-dialog-content>
  <mat-dialog-actions style="margin-top:12px" align="end"><button mat-button color="primary" style="margin-right:8px" (click)="dialogRef.close()">CANCEL</button>
  <button mat-raised-button color="accent" (click)="close()">CREATE</button>
  </mat-dialog-actions>
  `,
  styleUrls: ['./make-blog.component.css']
})
export class BlogVideoDialog {
  previewImg;
  image;
  uploadProgress;

  constructor(
    public dialogRef: MatDialogRef<BlogPhotoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private storage: AngularFireStorage
  ) {
  }

  public getVideo(): void {
    document.getElementById("image-input").click();
  }

  public setVideo(event): void {
    // callback from view
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();
      reader.onload = (event: ProgressEvent) => {
        this.previewImg = (<FileReader>event.target).result;
      };
      reader.readAsDataURL(event.target.files[0]);
      this.image = event.target.files[0];
      this.uploadVideo().subscribe(videoUrl => {
        this.data.videoUrl = videoUrl;
      })
    } else {
      this.previewImg = undefined; // broken image
      this.image = undefined;
    }
  }

  public uploadVideo(): Observable<string> {
    const date = new Date().getTime();
    let filePath = `BlogVideos/${date}`;
    let ref = this.storage.ref(filePath);
    let task = this.storage.upload(filePath, this.image);
    this.uploadProgress = task.snapshotChanges()
    .pipe(map(s => (s.bytesTransferred / s.totalBytes) * 100));
    return task.snapshotChanges().pipe(
      takeLast(1),
      flatMap(() => ref.getDownloadURL()),
      catchError(error => {
        console.error(`Error saving image for topic`, error);
        return (error);
      })
    );
  }

  close() {
    this.dialogRef.close(this.data);
  }
}

export class Blog {
  content: string;
  contentEs: string;
  createdAt: any;
  name: string;
  nameEs: string;
  topic: string;
  id?: string;
  imageUrl: string;
}

export class BlogTopic {
  name?: string;
  createdAt?: any;
}