import { Component, OnInit, HostListener, OnDestroy } from "@angular/core";
import { AngularEditorConfig } from "@kolkov/angular-editor";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { TrainingService, Article, Topic } from "../training.service";
import { CreateEditArticleService } from "./create-edit-article.service";
import { Observable, Subscription } from "rxjs";
import { Location } from "@angular/common";
import { ComponentCanDeactivate } from "./pending-changes.guard";
import { MatSnackBar, MatDialog } from "@angular/material";
import { AccountService } from "../../account.service";
import { ArticleMetaDescriptionDialog } from "./article-meta-description/article-meta-description.component";
import { ArticlePhotoDialog } from "./article-photo-upload/article-photo-upload.component";

@Component({
  selector: "app-create-edit-article",
  templateUrl: "./create-edit-article.component.html",
  styleUrls: ["./create-edit-article.component.css"],
  providers: [CreateEditArticleService]
})
export class CreateEditArticleComponent
  implements OnInit, ComponentCanDeactivate, OnDestroy {
  private teamId: string;
  private originalArticle: Article;
  private deactivate: boolean;
  private userSubscription: Subscription;
  public article = new Article();
  public isEdit: boolean;
  public submitButton: string = "CREATE ARTICLE";
  public loading: boolean;
  public topics: Observable<Topic[]>;
  public isGlobalArticle: boolean;
  public isDev: boolean;
  public slugNameError: string;
  @HostListener("window:beforeunload")
  public editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: "calc(100vh - 360px)",
    minHeight: "100px",
    placeholder: "Content *",
    translate: "yes"
  };
  public title: string;

  constructor(
    private route: ActivatedRoute,
    private service: CreateEditArticleService,
    private trainingService: TrainingService,
    private location: Location,
    private snackbar: MatSnackBar,
    private accountService: AccountService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.accountService.aTeamObservable.subscribe(team => {
      if (team) {
        this.teamId = team.id;
        this.getIsDev();
        this.route.queryParams.subscribe((params: ParamMap) => {
          const industryId = params["industryId"] || team.industryId;
          this.topics = this.trainingService.getTopics(industryId, team.id);
          if (params["articleId"]) {
            this.title = "Edit Article";
            this.getArticle(params["articleId"]);
            this.isEdit = true;
            this.submitButton = "UPDATE ARTICLE";
          } else {
            this.article.topicId = params["topicId"];
            this.title = "Create Article";
          }
        });
      }
    });
  }

  private getArticle(articleId): void {
    this.service.getArticle(articleId, this.teamId).subscribe(article => {
      this.originalArticle = { ...article };
      this.article = article;
    });
  }

  private getIsDev(): void {
    this.userSubscription = this.accountService.userObservable.subscribe(
      user => {
        if (user) this.isDev = user.isDev;
        this.isGlobalArticle = this.isDev ? true : false;
      }
    );
  }

  public submit(): void {
    this.isEdit && !this.loading ? this.updateArticle() : this.createArticle();
    this.loading = true;
  }

  private updateArticle(): void {
    this.slugNameError = '';
    this.article.slugName = this.article.slugName.split(' ').join('-').toLowerCase()
    this.service.checkSlugIsValid(this.article).subscribe(bool => {
      if (bool) {
        this.service.updateArticle(this.article, this.teamId).then(() => {
          this.deactivate = true;
          this.popSnackbar("Updated", this.article.name);
          this.trainingService.wipeArticles();
          this.goBack();
        });
      } else {
        this.loading = false;
        this.slugNameError = 'slug is already in use';
      }
    })
  }

  private createArticle(): void {
    const isGlobal =
      this.accountService.user.isDev && this.isGlobalArticle ? true : false;
    this.service.createArticle(this.article, this.teamId, isGlobal).then(id => {
      this.deactivate = true;
      this.popSnackbar("Created", this.article.name);
      this.trainingService.wipeArticles();
      this.goBack();
    });
  }

  addMetaDescription() {
    this.dialog.open(ArticleMetaDescriptionDialog, {
      data: this.article,
      disableClose: true
    });
  }

  addPhoto() {
    this.dialog.open(ArticlePhotoDialog, {
      data: this.article,
      disableClose: true
    });
  }

  private popSnackbar(verb, articleName): void {
    this.snackbar.open(`${verb} Article ${articleName}`, null, {
      duration: 3000
    });
  }

  public goBack(): void {
    this.location.back();
  }

  public deleteArticle(): void {
    let deleteArticle = true;
    let snackbar = this.snackbar.open("Deleting Article", "UNDO", {
      duration: 3000
    });
    snackbar.onAction().subscribe(() => (deleteArticle = false));
    snackbar.afterDismissed().subscribe(() => {
      if (deleteArticle) {
        this.service
          .deleteArticle(this.article.id, this.teamId)
          .then(() => {
            this.loading = false;
            this.deactivate = true;
            this.trainingService.wipeArticles();
            /* go back two pages */
            this.location.back();
            this.location.back();
          })
          .catch(() => alert("Unable to delete article"));
      }
    });
  }

  canDeactivate(): Observable<boolean> | boolean {
    // insert logic to check if there are pending changes here;
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    if (this.deactivate) return true;
    else if (!this.article.id && (this.article.name || this.article.content))
      return false;
    else if (this.article.id) {
      if (
        this.article.name.localeCompare(this.originalArticle.name) > 0 ||
        this.article.content.localeCompare(this.originalArticle.content) > 0 ||
        this.article.topicId !== this.originalArticle.topicId
      )
        return false;
      else return true;
    } else return true;
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
  }
}
