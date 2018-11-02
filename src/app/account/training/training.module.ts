import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Routes, RouterModule } from "@angular/router";
import { TrainingComponent } from "./training.component";
import { IndustriesComponent } from "./industries/industries.component";
import { TopicsComponent } from "./topics/topics.component";
import { ArticlesComponent } from "./articles/articles.component";
import { ArticleComponent } from "./article/article.component";
import { SharedModule } from "../../shared-module";
import { TrainingService } from "./training.service";
import { CreateEditArticleComponent } from "./create-edit-article/create-edit-article.component";
import { AngularEditorModule } from "@kolkov/angular-editor";
import { PendingChangesGuard } from "./create-edit-article/pending-changes.guard";
import { ProgressShieldComponent } from "./articles/progress-shield/progress-shield.component";
import { UserNamePipe } from "./article/user-name.pipe";
import { AddTraineeDialog } from "./article/add-trainee.dialog";
import { TopicDialogComponent } from "./topics/topic-dialog/topic-dialog.component";

const routes: Routes = [
  {
    path: "",
    component: TrainingComponent,
    children: [
      { path: "", component: IndustriesComponent },
      {
        path: "create-article",
        component: CreateEditArticleComponent,
        canDeactivate: [PendingChangesGuard]
      },
      {
        path: "edit-article",
        component: CreateEditArticleComponent,
        canDeactivate: [PendingChangesGuard]
      },
      { path: ":industry", component: TopicsComponent },
      { path: ":industry/:topic", component: ArticlesComponent },
      { path: ":industry/:topic/:article", component: ArticleComponent }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    AngularEditorModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    TrainingComponent,
    IndustriesComponent,
    TopicsComponent,
    ArticlesComponent,
    ArticleComponent,
    CreateEditArticleComponent,
    ProgressShieldComponent,
    UserNamePipe,
    AddTraineeDialog,
    TopicDialogComponent
  ],
  entryComponents: [AddTraineeDialog, TopicDialogComponent],
  providers: [TrainingService, PendingChangesGuard]
})
export class TrainingModule {}
