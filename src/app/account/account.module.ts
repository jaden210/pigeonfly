import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ProfileComponent,
  DeleteAccountDialog
} from "./account/account.component";
import {
  HomeComponent,
  InviteDialog,
  EditUserDialog,
  TeamFilesDialog
} from "./home/home.component";
import { SurveysModule } from "./surveys/surveys.module";
import { AccountRoutingModule } from "./account-routing.module";
import { MaterialModule } from "../material/material.module";
import { AccountComponent, WelcomeDialog } from "./account.component";
import { FormsModule } from "@angular/forms";
import { MomentModule } from "ngx-moment";
import { MapDialogComponent } from "./map-dialog/map-dialog.component";
import { DatePipe } from "@angular/common";
import { IncidentReportsComponent } from "./incident-reports/incident-reports.component";
import { EventComponent } from "./event/event.component";
import { NoAccessDialog } from "./account.service";
import { ImagesDialogComponent } from "./images-dialog/images-dialog.component";
import { TrainingModule } from "./training/training.module";
import { SharedModule } from "../shared-module";
import {
  AchievementsComponent,
  ConfirmCompleteDialog
} from "./achievements/achievements.component";
import { AngularEditorModule } from "@kolkov/angular-editor";
import { MakePaymentComponent } from "./account/payments/make-payment/make-payment.component";
import { PeopleDialogComponent } from "./people-dialog.component";
import { DeleteInspectionDialog } from "./self-inspections/self-inspections.service";
import { AgmCoreModule } from "@agm/core";
import { EventsFilterDialog } from "./event/filter-dialog/filter.dialog";

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
      apiKey: "AIzaSyAsIwXbCi4l__VoFLdru1EC3bLxmcZQOZI"
    })
  ],
  declarations: [
    AccountComponent,
    ProfileComponent,
    HomeComponent,
    EventComponent,
    InviteDialog,
    EditUserDialog,
    TeamFilesDialog,
    NoAccessDialog,
    MapDialogComponent,
    IncidentReportsComponent,
    ImagesDialogComponent,
    AchievementsComponent,
    WelcomeDialog,
    MakePaymentComponent,
    PeopleDialogComponent,
    DeleteAccountDialog,
    ConfirmCompleteDialog,
    DeleteInspectionDialog,
    EventsFilterDialog
  ],
  exports: [MaterialModule, TrainingModule, SurveysModule],
  entryComponents: [
    InviteDialog,
    MapDialogComponent,
    EditUserDialog,
    TeamFilesDialog,
    NoAccessDialog,
    ImagesDialogComponent,
    WelcomeDialog,
    MakePaymentComponent,
    PeopleDialogComponent,
    DeleteAccountDialog,
    ConfirmCompleteDialog,
    DeleteInspectionDialog,
    EventsFilterDialog
  ],
  providers: [DatePipe]
})
export class AccountModule {}
