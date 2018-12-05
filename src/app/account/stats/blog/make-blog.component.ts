import { Component, OnInit, Pipe } from '@angular/core';
import { AccountService } from '../../account.service';
import { map } from "rxjs/operators";
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { DomSanitizer, SafeHtml, SafeStyle, SafeUrl, SafeScript, SafeResourceUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material';
import { StatsService } from '../stats.service';

@Component({
  selector: 'app-make-blog',
  templateUrl: './make-blog.component.html',
  styleUrls: ['./make-blog.component.css']
})
export class BlogComponent implements OnInit {

 
  collection: string = 'osha-assesment-template-en';
  list;
  listId;

  blog = new Blog();
  topics: Observable<any>;

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
    if (this.blog.id) { //edit
      this.accountService.db.doc(`blog/${this.blog.id}`).update({...this.blog}).then(() => {
        this.blog = new Blog();
        this.statsService.makeBlog = false;
      })
    } else {
      this.blog.createdAt = new Date();
      const id = this.blog.linkName ? this.blog.linkName.split(' ').join('-').toLowerCase() : this.blog.name.split(' ').join('-').toLowerCase();
      this.accountService.db.collection("blog").doc(id).set({...this.blog}).then(() => {
        this.blog = new Blog();
        this.statsService.makeBlog = false;
      }, error => console.error("link name is already taken: " + error));
    }
  }

  newTopic() {
    let dialog = this.dialog.open(BlogTopicDialog)
    dialog.afterClosed().subscribe(data => {
      if (data) {
        let blog = {
          name: data.name,
          createdAt: new Date(),
        }
        let id = data.name.split(' ').join('-').toLowerCase();
        this.accountService.db.collection("blog-topic").doc(id).set({...blog}).then(() => {
          this.blog.topicId = id;
        }, error => {
          console.error("Topic name is already created.");
          this.blog.topicId = id;
        });
      }
    })
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
  <button mat-raised-button color="warn" (click)="close(topic)">CREATE</button>
  </mat-dialog-actions>
  `
})
export class BlogTopicDialog {
  topic = {};
  constructor(
    public dialogRef: MatDialogRef<BlogTopicDialog>
  ) {}

  close(topic) {
    this.dialogRef.close(topic);
  }
}

export class Blog {
  content: string;
  contentEs: string;
  createdAt: any;
  name: string;
  nameEs: string;
  topicId: string;
  id?: string;
  linkName?: string;
}