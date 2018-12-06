import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { SharedModule } from "../../shared-module";
import { AngularEditorModule } from "@kolkov/angular-editor";
import { HomeComponent } from "./home/home.component";
import { SupportService } from "./support.service";
import { BlogComponent } from "./blogs/blog/make-blog.component";
import { BlogsComponent } from "./blogs/view-blogs.component";
import { BlogMetaDescriptionDialog } from "./dialogs/blog-meta-description/blog-meta-description.component";
import { BlogPhotoDialog } from "./dialogs/blog-photo-upload/blog-photo-upload.component";
import { BlogVideoDialog } from "./dialogs/blog-video-upload/blog-video-upload.component";
import { BlogTopicDialog } from "./dialogs/blog-topic-generator/blog-topic-generator.component";
import { InspectionQuestionsComponent } from "./inspection-questions/inspection-questions.component";
import { WebSupportComponent } from "./web-support/web-support.component";
import { StatisticsComponent } from "./statistics/statistics.component";
import { FeedbackComponent } from "./feedback/feedback.component";
import { SupportComponent } from "./support.component";

const routes: Routes = [
  { path: "", component: HomeComponent }
];

@NgModule({
  imports: [SharedModule, AngularEditorModule, RouterModule.forChild(routes)],
  declarations: [
    HomeComponent,
    InspectionQuestionsComponent,
    WebSupportComponent,
    FeedbackComponent,
    StatisticsComponent,
    BlogsComponent,
    BlogComponent,
    BlogPhotoDialog,
    BlogVideoDialog,
    BlogMetaDescriptionDialog,
    BlogTopicDialog,
    SupportComponent
  ],
  entryComponents: [
    BlogPhotoDialog,
    BlogVideoDialog,
    BlogMetaDescriptionDialog,
    BlogTopicDialog
  ],
  providers: [SupportService]
})
export class SupportModule {}
