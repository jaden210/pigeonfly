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
import { WebSupportComponent } from "./web-support/web-support.component";
import { StatisticsComponent } from "./statistics/statistics.component";
import { SupportComponent } from "./support.component";
import { GymsComponent } from "./gyms/gyms.component";
import { GymComponent, QRDialog } from "./gyms/gym/gym.component";
import { QRCodeModule } from 'angular2-qrcode';

const routes: Routes = [
  { path: "", component: HomeComponent }
];

@NgModule({
  imports: [SharedModule, QRCodeModule, AngularEditorModule, RouterModule.forChild(routes)],
  declarations: [
    HomeComponent,
    WebSupportComponent,
    StatisticsComponent,
    BlogsComponent,
    BlogComponent,
    BlogPhotoDialog,
    BlogVideoDialog,
    BlogMetaDescriptionDialog,
    BlogTopicDialog,
    GymsComponent,
    GymComponent,
    SupportComponent,
    QRDialog
  ],
  entryComponents: [
    BlogPhotoDialog,
    BlogVideoDialog,
    BlogMetaDescriptionDialog,
    BlogTopicDialog,
    QRDialog
  ],
  providers: [SupportService]
})
export class SupportModule {}
