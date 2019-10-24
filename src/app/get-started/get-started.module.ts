import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { SharedModule } from "../shared-module";
import { GetStartedComponent } from "./get-started.component";
import { GetStartedService } from "./get-started.service";
import { Step1Component } from "./step1/step1.component";

const routes: Routes = [
  {
    path: "",
    component: GetStartedComponent,
    children: [
      { path: "", redirectTo: "step1", pathMatch: "full" },
      { path: "step1", component: Step1Component }
    ]
  }
];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [
    GetStartedComponent,
    Step1Component
  ],
  entryComponents: [],
  providers: [GetStartedService]
})
export class GetStartedModule {}
