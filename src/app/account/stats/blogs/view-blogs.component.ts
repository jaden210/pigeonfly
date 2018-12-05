import { Component, OnInit, Pipe } from '@angular/core';
import { AccountService } from '../../account.service';
import { map } from "rxjs/operators";
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { DomSanitizer, SafeHtml, SafeStyle, SafeUrl, SafeScript, SafeResourceUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { StatsService } from '../stats.service';

@Component({
  selector: 'app-view-blogs',
  templateUrl: './view-blogs.component.html',
  styleUrls: ['./view-blogs.component.css']
})
export class BlogsComponent implements OnInit {

  blogs: Observable<any>;

  constructor(
    public accountService: AccountService,
    public statsService: StatsService
  ) { }

  ngOnInit() {
    this.blogs = this.accountService.db.collection("blog").snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
          const data = a.payload.doc.data() as any;
          const id = a.payload.doc.id;
          return { id, ...data };
        })
      )
    )
  }

  newBlog() {
    this.statsService.makeBlog = true;
  }

}


export class NewDoc {
  id?: string;
  subject: string;
  questions: any;
  order: number = 0;
}

export class NewQ {
  id?: string;
  name: string;
  createdAt: Date;
}

export class Blog {
  content: string;
  contentEs: string;
  name: string;
  nameEs: string;
  topicId: string;
  id?: string;
  linkName?: string;
}