import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { TrainingComponent } from "./training.component";
import { IndustriesComponent } from "./industries/industries.component";
import { TopicsComponent } from "./topics/topics.component";
import { ArticlesComponent } from "./articles/articles.component";
import { ArticleComponent } from "./article/article.component";
import { MyContentComponent } from "./my-content/my-content.component";
import { SharedModule } from "../../shared-module";
import { TrainingService } from "./training.service";
import { CreateEditArticleComponent } from "./create-edit-article/create-edit-article.component";
import { AngularEditorModule } from "@kolkov/angular-editor";
import { PendingChangesGuard } from "./create-edit-article/pending-changes.guard";
import { ProgressIndicatorComponent } from "./shared/progress-indicator/progress-indicator.component";
import { AddTraineeDialog } from "./article/add-trainee.dialog";
import { AttendanceDialog } from "./article/attendance.dialog";
import { TopicDialogComponent } from "./topics/topic-dialog/topic-dialog.component";
import { UserHistoryDialog } from "./article/user-history.dialog";
import { TrainingHistoryComponent } from "./training-history/training-history.component";
import { NeedsTrainingDialog } from "./article/needs-training.dialog";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { ReceivedTrainingDialog } from "./training-history/received-training.dialog";
import { MyContentSearchPipe } from "./my-content/search.pipe";
import { MyContentFiltersDialog } from "./my-content/my-content-filters.dialog";
import { HelpDialog } from "./help.dialog";
import { ArticlesSearchPipe } from "./articles/search.pipe";

const routes: Routes = [
  {
    path: "",
    component: TrainingComponent,
    children: [
      { path: "", component: DashboardComponent },
      { path: "my-content", component: MyContentComponent },
      { path: "my-content/:article", component: ArticleComponent },
      { path: "industries", component: IndustriesComponent },
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
      { path: "history/:article", component: TrainingHistoryComponent },
      { path: "article/:article", component: ArticleComponent },
      { path: ":industry", component: TopicsComponent },
      { path: ":industry/:topic", component: ArticlesComponent },
      { path: ":industry/:topic/:article", component: ArticleComponent }
    ]
  }
];

@NgModule({
  imports: [SharedModule, AngularEditorModule, RouterModule.forChild(routes)],
  declarations: [
    TrainingComponent,
    IndustriesComponent,
    TopicsComponent,
    ArticlesComponent,
    ArticleComponent,
    CreateEditArticleComponent,
    ProgressIndicatorComponent,
    AddTraineeDialog,
    TopicDialogComponent,
    AttendanceDialog,
    UserHistoryDialog,
    TrainingHistoryComponent,
    NeedsTrainingDialog,
    DashboardComponent,
    ReceivedTrainingDialog,
    MyContentComponent,
    MyContentSearchPipe,
    MyContentFiltersDialog,
    HelpDialog,
    ArticlesSearchPipe
  ],
  entryComponents: [
    AddTraineeDialog,
    TopicDialogComponent,
    AttendanceDialog,
    UserHistoryDialog,
    NeedsTrainingDialog,
    ReceivedTrainingDialog,
    MyContentFiltersDialog,
    HelpDialog
  ],
  providers: [TrainingService, PendingChangesGuard]
})
export class TrainingModule {}
