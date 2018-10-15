import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProfileComponent } from "./account/account.component";
import { HomeComponent, InviteDialog, EditUserDialog } from "./home/home.component";
import { SurveyComponent } from "./survey/survey.component";
import { TimeComponent } from "./time/time.component";
import { LogComponent } from "./log/log.component";
import { AssesmentComponent } from "./assesment/assesment.component";
import { AccountRoutingModule } from "./account-routing.module";
import { MaterialModule } from "../material/material.module";
import { AccountComponent, TeamSelectDialog } from "./account.component";
import { FormsModule } from "@angular/forms";
import { AgmCoreModule } from "@agm/core";
import { MomentModule } from "angular2-moment";
import { SearchPipe } from "./log/search.pipe";
import { MapDialogComponent } from "./map-dialog/map-dialog.component";
import { DatePipe } from "@angular/common";
import { IncidentReportsComponent } from "./incident-reports/incident-reports.component";
import { EventComponent } from "./event/event.component";
import { EventSearchPipe } from "./event/search.pipe";
import { ToolbarHelperComponent } from "./toolbar-helper/toolbar-helper.component";
import { NoAccessDialog } from "./account.service";

@NgModule({
  imports: [
    CommonModule,
    AccountRoutingModule,
    MaterialModule,
    FormsModule,
    MomentModule,
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
    MapDialogComponent,
    IncidentReportsComponent,
    ToolbarHelperComponent
  ],
  exports: [MaterialModule],
  entryComponents: [InviteDialog, MapDialogComponent, EditUserDialog, TeamSelectDialog, NoAccessDialog],
  providers: [DatePipe]
})
export class AccountModule {}
