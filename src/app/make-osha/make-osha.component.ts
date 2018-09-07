import { Component, OnInit, Pipe } from "@angular/core";
import { AppService } from "../app.service";
import { map, tap, catchError, finalize } from "rxjs/operators";
import { AngularEditorConfig } from "@kolkov/angular-editor";
import { MatSnackBar } from "@angular/material";
import { Location } from "@angular/common";
import {
  DomSanitizer,
  SafeHtml,
  SafeStyle,
  SafeUrl,
  SafeScript,
  SafeResourceUrl
} from "@angular/platform-browser";
import { Observable, of } from "rxjs";

@Component({
  selector: "app-make-osha",
  templateUrl: "./make-osha.component.html",
  styleUrls: ["./make-osha.component.css"]
})
export class MakeOSHAComponent implements OnInit {
  private oshaManual: string = "osha-manual-en";
  public articles: Observable<any[]>;
  public activeArticle = new Article();
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
    private location: Location
  ) {}

  ngOnInit() {
    this.getIndustries();
  }

  public goBack(): void {
    this.location.back();
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
        }),
        catchError(error => {
          console.error(`Error loading industries collection. ${error}`);
          alert(`Error loading industries collection for ${this.oshaManual}`);
          return of([]);
        })
      );
  }

  public setIndustry(industry): void {
    this.newArticle();
    this.getArticles(industry);
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

  public setActiveArticle(article = new Article()): void {
    this.activeArticle = { ...article };
  }

  public createArticle(): void {
    this.appService.db
      .collection(`${this.oshaManual}/${this.industry.id}/articles`)
      .add({ ...this.activeArticle })
      .then(
        () => {
          this.snackbar
            .open(`Created Article ${this.activeArticle.name}`, null, {
              duration: 2000
            })
            .afterDismissed()
            .subscribe(() => this.newArticle());
        },
        error => {
          console.error(
            `Error creating article. ${this.activeArticle} ${error}`
          );
          alert(`Error creating article ${this.activeArticle.name}`);
        }
      );
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
          this.snackbar
            .open(`Updated Article ${this.activeArticle.name}`, null, {
              duration: 2000
            })
            .afterDismissed()
            .subscribe(() => {});
        },
        error => {
          console.error(
            `Error updating article. ${this.activeArticle} ${error}`
          );
          alert(
            `Error updating article ${
              this.activeArticle.name
            }, falling back to original`
          );
        }
      );
  }

  public resetForm(): void {
    if (this.activeArticle.id) {
      this.appService.db
        .doc(
          `${this.oshaManual}/${this.industry.id}/articles/${
            this.activeArticle.id
          }`
        )
        .snapshotChanges()
        .pipe(
          map(a => {
            const data = a.payload.data();
            const id = a.payload.id;
            return <Article>{ id, ...data };
          })
        )
        .subscribe(article => (this.activeArticle = article));
    } else {
      this.newArticle();
    }
  }

  public newArticle(): void {
    setTimeout(() => (this.activeArticle = new Article()), 100);
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
            () => {
              this.newArticle();
            },
            error => {
              console.error(
                `Error deleting article ${
                  deletedArticle.name
                }, ${deletedArticle} ${error}`
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
}

export class Article {
  name: string;
  content: string;
  order: number;
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
