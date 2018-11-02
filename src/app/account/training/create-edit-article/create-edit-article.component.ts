import { Component, OnInit, HostListener } from "@angular/core";
import { AngularEditorConfig } from "@kolkov/angular-editor";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { TrainingService, Article, Topic } from "../training.service";
import { CreateEditArticleService } from "./create-edit-article.service";
import { Observable } from "rxjs";
import { Location } from "@angular/common";
import { ComponentCanDeactivate } from "./pending-changes.guard";
import { MatSnackBar } from "@angular/material";

@Component({
  selector: "app-create-edit-article",
  templateUrl: "./create-edit-article.component.html",
  styleUrls: ["./create-edit-article.component.css"],
  providers: [CreateEditArticleService]
})
export class CreateEditArticleComponent
  implements OnInit, ComponentCanDeactivate {
  private originalArticle: Article;
  public article = new Article();
  public isEdit: boolean;
  public submitButton: string = "CREATE ARTICLE";
  public loading: boolean;
  public topics: Observable<Topic[]>;
  @HostListener("window:beforeunload")
  public editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: "calc(100vh - 360px)",
    minHeight: "100px",
    placeholder: "Content *",
    translate: "yes"
  };

  constructor(
    private route: ActivatedRoute,
    private service: CreateEditArticleService,
    private trainingService: TrainingService,
    private location: Location,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params: ParamMap) => {
      this.topics = this.service.getTopics();
      if (params["articleId"]) {
        this.trainingService.setActiveRoute("Edit Article");
        this.getArticle(params["articleId"]);
        this.isEdit = true;
        this.submitButton = "UPDATE ARTICLE";
      } else {
        this.trainingService.setActiveRoute("Create Article");
      }
    });
  }

  private getArticle(articleId): void {
    this.service.getArticle(articleId).subscribe(article => {
      this.originalArticle = { ...article };
      this.article = article;
    });
  }

  public submit(): void {
    this.isEdit && !this.loading ? this.updateArticle() : this.createArticle();
    this.loading = true;
  }

  private updateArticle(): void {
    this.service.updateArticle(this.article).then(() => {
      this.popSnackbar("Updated", this.article.name);
      this.goBack();
    });
  }

  private createArticle(): void {
    this.service.createArticle(this.article).then(() => {
      this.popSnackbar("Created", this.article.name);
      this.goBack();
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

  canDeactivate(): Observable<boolean> | boolean {
    // insert logic to check if there are pending changes here;
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    if (!this.article.id && (this.article.name || this.article.content))
      return false;
    else if (this.article.id) {
      if (
        this.article.name.localeCompare(this.originalArticle.name) > 0 ||
        this.article.content.localeCompare(this.originalArticle.content) > 0 ||
        this.article.topicIds !== this.originalArticle.topicIds
      )
        return false;
      else return true;
    } else return true;
  }
}
