import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { AccountComponent } from "./account.component";
import { ProfileComponent } from "./account/account.component";
import { AssesmentComponent } from "./assesment/assesment.component";
import { LogComponent } from "./log/log.component";
import { TimeComponent } from "./time/time.component";
import { IncidentReportsComponent } from "./incident-reports/incident-reports.component";
import { EventComponent } from "./event/event.component";
import { WelcomeComponent } from "./welcome/welcome.component";
import { StatsComponent } from "./stats/stats.component";
import { AuthGuard } from "./auth.gaurd";

const routes: Routes = [
  {
    path: "",
    component: AccountComponent,
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      { path: "dashboard", component: HomeComponent },
      { path: "account", component: ProfileComponent },
      { path: "assesment", component: AssesmentComponent },
      { path: "log", component: LogComponent },
      { path: "time", component: TimeComponent },
      { path: "event", component: EventComponent },
      { path: "incident-reports", component: IncidentReportsComponent },
      { path: "achievements", component: WelcomeComponent },
      { path: "overvieww", component: StatsComponent, canActivate: [AuthGuard] },
      {
        path: "training",
        loadChildren: "./training/training.module#TrainingModule"
      },
      {
        path: "surveys",
        loadChildren: "./surveys/surveys.module#SurveysModule"
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule {}
