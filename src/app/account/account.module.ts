import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProfileComponent } from "./account/account.component";
import {
  HomeComponent,
  InviteDialog,
  EditUserDialog
} from "./home/home.component";
import { SurveyComponent } from "./survey/survey.component";
import { TimeComponent, CreateEditTimeDialog } from "./time/time.component";
import { LogComponent, CreateEditLogDialog } from "./log/log.component";
import { AssesmentComponent } from "./assesment/assesment.component";
import { AccountRoutingModule } from "./account-routing.module";
import { MaterialModule } from "../material/material.module";
import {
  AccountComponent,
  TeamSelectDialog,
  WelcomeDialog
} from "./account.component";
import { FormsModule } from "@angular/forms";
import { AgmCoreModule } from "@agm/core";
import { MomentModule } from "angular2-moment";
import { SearchPipe } from "./log/search.pipe";
import { MapDialogComponent } from "./map-dialog/map-dialog.component";
import { DatePipe } from "@angular/common";
import { IncidentReportsComponent } from "./incident-reports/incident-reports.component";
import { EventComponent } from "./event/event.component";
import { EventSearchPipe } from "./event/search.pipe";
import { NoAccessDialog } from "./account.service";
import { ImagesDialogComponent } from "./images-dialog/images-dialog.component";
import { SurveySearchPipe } from "./survey/search.pipe";
import { TrainingModule } from "./training/training.module";
import { SharedModule } from "../shared-module";

@NgModule({
  imports: [
    CommonModule,
    AccountRoutingModule,
    MaterialModule,
    FormsModule,
    MomentModule,
    TrainingModule,
    SharedModule,
    AgmCoreModule.forRoot({
      apiKey: "AIzaSyCg1x6Pm29QsCbzSb0Astep5D4_-KEXlSk",
      libraries: ["places"]
    })
  ],
  declarations: [
    AccountComponent,
    TeamSelectDialog,
    ProfileComponent,
    HomeComponent,
    SurveyComponent,
    TimeComponent,
    LogComponent,
    EventComponent,
    AssesmentComponent,
    InviteDialog,
    EditUserDialog,
    NoAccessDialog,
    SearchPipe,
    EventSearchPipe,
    SurveySearchPipe,
    MapDialogComponent,
    IncidentReportsComponent,
    ImagesDialogComponent,
    CreateEditLogDialog,
    CreateEditTimeDialog,
    WelcomeDialog
  ],
  exports: [MaterialModule, TrainingModule],
  entryComponents: [
    InviteDialog,
    MapDialogComponent,
    EditUserDialog,
    TeamSelectDialog,
    NoAccessDialog,
    ImagesDialogComponent,
    CreateEditLogDialog,
    CreateEditTimeDialog,
    WelcomeDialog
  ],
  providers: [DatePipe]
})
export class AccountModule {}
