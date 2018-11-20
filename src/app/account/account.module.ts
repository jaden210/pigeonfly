import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProfileComponent } from "./account/account.component";
import {
  HomeComponent,
  InviteDialog,
  EditUserDialog
} from "./home/home.component";
import { SurveysModule } from "./surveys/surveys.module";
import { TimeComponent, CreateEditTimeDialog } from "./time/time.component";
import { LogComponent, CreateEditLogDialog } from "./log/log.component";
import { AccountRoutingModule } from "./account-routing.module";
import { MaterialModule } from "../material/material.module";
import {
  AccountComponent,
  WelcomeDialog
} from "./account.component";
import { FormsModule } from "@angular/forms";
import { AgmCoreModule } from "@agm/core";
import { MomentModule } from "ngx-moment";
import { SearchPipe } from "./log/search.pipe";
import { MapDialogComponent } from "./map-dialog/map-dialog.component";
import { DatePipe } from "@angular/common";
import { IncidentReportsComponent } from "./incident-reports/incident-reports.component";
import { EventComponent } from "./event/event.component";
import { EventSearchPipe } from "./event/search.pipe";
import { NoAccessDialog } from "./account.service";
import { ImagesDialogComponent } from "./images-dialog/images-dialog.component";
import { TrainingModule } from "./training/training.module";
import { SharedModule } from "../shared-module";
import { AchievementsComponent } from "./achievements/achievements.component";
import { StatsComponent } from "./stats/stats.component";
import { AngularEditorModule } from "@kolkov/angular-editor";
import { AssesComponent } from "./stats/ases/make-osha.component";
import { MakePaymentComponent } from "./account/payments/make-payment/make-payment.component";
import { PeopleDialogComponent } from "./people-dialog.component";

@NgModule({
  imports: [
    CommonModule,
    AccountRoutingModule,
    MaterialModule,
    FormsModule,
    MomentModule,
    TrainingModule,
    SurveysModule,
    SharedModule,
    AngularEditorModule,
    AgmCoreModule.forRoot({
      apiKey: "AIzaSyCg1x6Pm29QsCbzSb0Astep5D4_-KEXlSk",
      libraries: ["places"]
    })
  ],
  declarations: [
    AccountComponent,
    ProfileComponent,
    HomeComponent,
    TimeComponent,
    LogComponent,
    EventComponent,
    InviteDialog,
    EditUserDialog,
    NoAccessDialog,
    SearchPipe,
    EventSearchPipe,
    MapDialogComponent,
    IncidentReportsComponent,
    ImagesDialogComponent,
    CreateEditLogDialog,
    CreateEditTimeDialog,
    AchievementsComponent,
    WelcomeDialog,
    StatsComponent,
    AssesComponent,
    MakePaymentComponent,
    PeopleDialogComponent
  ],
  exports: [MaterialModule, TrainingModule, SurveysModule],
  entryComponents: [
    InviteDialog,
    MapDialogComponent,
    EditUserDialog,
    NoAccessDialog,
    ImagesDialogComponent,
    CreateEditLogDialog,
    CreateEditTimeDialog,
    WelcomeDialog,
    MakePaymentComponent,
    PeopleDialogComponent
  ],
  providers: [DatePipe]
})
export class AccountModule {}
