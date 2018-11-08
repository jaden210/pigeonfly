import { Component, OnInit, Pipe } from "@angular/core";
import { AppService } from "../app.service";
import {
  map,
  tap,
  catchError,
  share,
  flatMap,
  mergeMap,
  concatMap
} from "rxjs/operators";
import { AngularEditorConfig } from "@kolkov/angular-editor";
import { MatSnackBar, MatDialog } from "@angular/material";
import { Location } from "@angular/common";
import { PreviewDialogComponent } from "./preview-dialog/preview-dialog.component";
import { AngularFirestore } from "@angular/fire/firestore";
import {
  DomSanitizer,
  SafeHtml,
  SafeStyle,
  SafeUrl,
  SafeScript,
  SafeResourceUrl
} from "@angular/platform-browser";
import { Observable, of } from "rxjs";
import {
  TopicDialogComponent,
  Topic
} from "./topic-dialog/topic-dialog.component";

@Component({
  selector: "app-make-osha",
  templateUrl: "./make-osha.component.html",
  styleUrls: ["./make-osha.component.css"]
})
export class MakeOSHAComponent implements OnInit {
  private oshaManual: string = "osha-manual-en";
  public topics: Observable<any[]>;
  public articles: Observable<any[]>;
  public activeArticle = new Article();
  private originalActiveArticle: Article;
  public industries: Observable<any[]>;
  public industry;

  public editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: "calc(100vh - 380px)",
    minHeight: "100px",
    placeholder: "Content *",
    translate: "yes"
  };

  constructor(
    private appService: AppService,
    private snackbar: MatSnackBar,
    private location: Location,
    private dialog: MatDialog,
    private db: AngularFirestore
  ) {}

  ngOnInit() {
    this.getIndustries();
    this.getIndustries1();
  }

  public goBack(): void {
    if (this.confirmNavigation()) {
      this.location.back();
    }
  }

  private getIndustries(): void {
    this.industries = this.appService.db
      .collection(this.oshaManual, ref => ref.orderBy("industryName", "asc"))
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { id, ...data };
          })
        ),
        tap(industries => {
          this.getArticles(industries[0]);
          this.getTopics(industries[0]);
        }),
        catchError(error => {
          console.error(`Error loading industries collection. ${error}`);
          alert(`Error loading industries collection for ${this.oshaManual}`);
          return of([]);
        })
      );
  }

  public setIndustry(industry): void {
    if (this.confirmNavigation()) {
      this.newArticle();
      this.getArticles(industry);
      this.getTopics(industry);
    }
  }

  private getArticles(industry): void {
    this.industry = industry;
    this.articles = this.appService.db
      .doc(`${this.oshaManual}/${industry.id}`)
      .collection("articles")
      .snapshotChanges()
      .pipe(
        map((actions: any[]) =>
          actions.map(a => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { id, ...data };
          })
        ),
        map(articles => {
          const orderedArticles = articles
            .filter(article => article.order || article.order == 0)
            .sort((a, b) => (a.order < b.order ? -1 : 1));
          const alphabetizedArticles = articles
            .filter(article => !article.order && article.order != 0)
            .sort(
              (a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1)
            );
          return [...orderedArticles, ...alphabetizedArticles];
        }),
        catchError(error => {
          console.error(`Error loading articles collection. ${error}`);
          alert(
            `Error loading articles collection for ${this.oshaManual}/${
              industry.id
            }`
          );
          return of([]);
        })
      );
  }

  private getTopics(industry): void {
    this.topics = this.appService.db
      .doc(`${this.oshaManual}/${industry.id}`)
      .collection("topics")
      .snapshotChanges()
      .pipe(
        map((actions: any[]) =>
          actions.map(a => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { id, ...data };
          })
        ),
        map(topics => {
          return topics.sort(
            (a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1)
          );
        }),
        catchError(error => {
          console.error(`Error loading topics collection. ${error}`);
          alert(
            `Error loading topics collection for ${this.oshaManual}/${
              industry.id
            }`
          );
          return of([]);
        }),
        share()
      );
  }

  public setActiveArticle(article = new Article()): void {
    if (this.confirmNavigation()) {
      this.activeArticle = { ...article };
      this.originalActiveArticle = { ...article };
    }
  }

  private confirmNavigation(): boolean {
    if (
      !this.activeArticle.id &&
      (this.activeArticle.name || this.activeArticle.content)
    ) {
      return window.confirm(
        "You have unsaved changes, are you sure you want to exit?"
      );
    } else if (this.activeArticle.id) {
      if (
        this.activeArticle.name.localeCompare(this.originalActiveArticle.name) >
          0 ||
        this.activeArticle.content.localeCompare(
          this.originalActiveArticle.content
        ) > 0 ||
        this.activeArticle.topicId !== this.originalActiveArticle.topicId
      )
        return window.confirm(
          "You have unsaved changes, are you sure you want to exit?"
        );
      else return true;
    } else return true;
  }

  public editTopic(): void {
    this.appService.db
      .doc(
        `${this.oshaManual}/${this.industry.id}/topics/${
          this.activeArticle.topicId
        }`
      )
      .snapshotChanges()
      .pipe(
        map(a => {
          const data = a.payload.data();
          const id = a.payload.id;
          return <Topic>{ id, ...data };
        })
      )
      .subscribe(topic => this.launchTopicDialog(topic));
  }

  public createTopic(): void {
    this.launchTopicDialog(new Topic());
  }

  private launchTopicDialog(topic: Topic): void {
    this.dialog
      .open(TopicDialogComponent, {
        data: {
          industryId: this.industry.id,
          oshaManual: this.oshaManual,
          topic
        }
      })
      .afterClosed()
      .subscribe(topicId => {
        console.log(topicId);
        this.getTopics(this.industry);
        if (topicId == "deleted") {
          this.activeArticle.topicId = null;
        } else if (topicId) this.activeArticle.topicId = topicId; // save it
      });
  }

  public createArticle(): void {
    this.appService.db
      .collection(`${this.oshaManual}/${this.industry.id}/articles`)
      .add({ ...this.activeArticle })
      .then(
        () => {
          this.originalActiveArticle = this.activeArticle;
          this.snackbar
            .open(`Created Article ${this.activeArticle.name}`, null, {
              duration: 2000
            })
            .afterDismissed()
            .subscribe(() => this.newArticle());
        },
        error => {
          console.error(
            `Error creating article ${this.activeArticle.name}`,
            this.activeArticle,
            error
          );
          alert(`Error creating article ${this.activeArticle.name}`);
        }
      );
  }

  migrate() {
    this.appService.db
      .doc(`${this.oshaManual}/ijIMGXUQGNkfxOzptzey`)
      .collection("topics")
      .snapshotChanges()
      .pipe(
        map((actions: any[]) =>
          actions.map(a => {
            let data = a.payload.doc.data();
            const industryIds = ["ijIMGXUQGNkfxOzptzey"];
            const id = a.payload.doc.id;
            const isGlobal = true;
            return { ...data, industryIds, id, isGlobal };
          })
        )
      )
      .subscribe(articles => {
        articles.forEach(article => {
          let id = article.id;
          delete article.id;
          // this.appService.db.collection(`topic`).add(article);
          this.db
            .collection("topic")
            .doc(id)
            .set(article);
        });
      });
  }

  public updateArticle(): void {
    this.appService.db
      .doc(
        `${this.oshaManual}/${this.industry.id}/articles/${
          this.activeArticle.id
        }`
      )
      .update({ ...this.activeArticle })
      .then(
        () => {
          this.originalActiveArticle = this.activeArticle;
          this.snackbar
            .open(`Updated Article ${this.activeArticle.name}`, null, {
              duration: 2000
            })
            .afterDismissed()
            .subscribe(() => {});
        },
        error => {
          console.error(
            `Error updating article ${this.activeArticle.name}`,
            this.activeArticle,
            error
          );
          alert(
            `Error updating article ${
              this.activeArticle.name
            }, falling back to original`
          );
        }
      );
  }

  public previewArticle(): void {
    this.dialog.open(PreviewDialogComponent, {
      data: { ...this.activeArticle }
    });
  }

  public startANewArticle(): void {
    if (this.confirmNavigation()) {
      this.newArticle();
    }
  }

  public resetForm(): void {
    if (this.confirmNavigation()) {
      if (this.activeArticle.id) {
        this.activeArticle = { ...this.originalActiveArticle };
      } else this.newArticle();
    }
  }

  private newArticle(): void {
    setTimeout(() => {
      this.activeArticle = new Article();
      this.originalActiveArticle = new Article();
    }, 100);
  }

  public deleteArticle(): void {
    let deletedArticle = { ...this.activeArticle };
    this.newArticle();
    let deleteArticle = true;
    let snackbarRef = this.snackbar.open(
      `Deleted Article ${deletedArticle.name}`,
      "UNDO",
      { duration: 4000 }
    );
    snackbarRef.onAction().subscribe(() => (deleteArticle = false));
    snackbarRef.afterDismissed().subscribe(() => {
      if (deleteArticle) {
        this.appService.db
          .doc(
            `${this.oshaManual}/${this.industry.id}/articles/${
              deletedArticle.id
            }`
          )
          .delete()
          .then(
            () => {},
            error => {
              console.error(
                `Error deleting article ${deletedArticle.name}`,
                deletedArticle,
                error
              );
              alert(`Error deleting article ${deletedArticle.name}`);
              this.activeArticle = deletedArticle;
            }
          );
      } else {
        this.activeArticle = deletedArticle;
      }
    });
  }

  industries1;
  private getIndustries1(): void {
    this.industries1 = this.db
      .collection("industries", ref => ref.orderBy("name", "asc"))
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            const topics = this.getTopics1(id);
            return { ...data, id, topics };
          })
        ),
        catchError(error => {
          console.error(`Error loading industries collection. ${error}`);
          alert(`Error loading industries collection for ${this.oshaManual}`);
          return of([]);
        })
      );
  }

  private getTopics1(industryId): Observable<any> {
    return this.db
      .collection("topics", ref =>
        ref.where("industryIds", "array-contains", industryId)
      )
      .snapshotChanges()
      .pipe(
        map((actions: any[]) =>
          actions.map(a => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            const articles = this.getArticles1(id);
            return { ...data, id };
          })
        ),
        // map(topics => {
        //   return topics.sort(
        //     (a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1)
        //   );
        // }),
        catchError(error => {
          console.error(`Error loading topics collection. ${error}`);
          alert(
            `Error loading topics collection for ${
              this.oshaManual
            }/${industryId}`
          );
          return of([]);
        })
      );
  }

  private getArticles1(topicId): Observable<any> {
    return this.db
      .collection("articles")
      .snapshotChanges()
      .pipe(
        map((actions: any[]) =>
          actions.map(a => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { id, ...data };
          })
        ),
        catchError(error => {
          console.error(`Error loading articles collection. ${error}`);
          alert(`Error loading articles collection for ${topicId}`);
          return of([]);
        })
      );
  }
}

export class Article {
  name: string;
  content: string;
  order: number;
  topicId: string;
  id?: string;
}

@Pipe({ name: "safeHtml" })
export class Safe {
  constructor(protected _sanitizer: DomSanitizer) {}

  public transform(
    value: string,
    type: string = "html"
  ): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl {
    switch (type) {
      case "html":
        return this._sanitizer.bypassSecurityTrustHtml(value);
      case "style":
        return this._sanitizer.bypassSecurityTrustStyle(value);
      case "script":
        return this._sanitizer.bypassSecurityTrustScript(value);
      case "url":
        return this._sanitizer.bypassSecurityTrustUrl(value);
      case "resourceUrl":
        return this._sanitizer.bypassSecurityTrustResourceUrl(value);
      default:
        throw new Error(`Invalid safe type specified: ${type}`);
    }
  }
}
