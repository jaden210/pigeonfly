import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Routes, RouterModule } from "@angular/router";
import { SelfInspectionsComponent } from "./self-inspections.component";
import { SharedModule } from "../../shared-module";
import { SelfInspectionComponent } from "./self-inspection/self-inspection.component";
import { SelfInspectionsService } from "./self-inspections.service";
import { CreateEditSelfInspectionComponent } from "./create-edit-self-inspection/create-edit-self-inspection.component";
import { SelfInspectionsListComponent } from "./self-inspections-list/self-inspections-list.component";
import { TakeSelfInspectionComponent } from "./take-self-inspection/take-self-inspection.component";

const routes: Routes = [
  {
    path: "",
    component: SelfInspectionsComponent,
    children: [
      { path: "", component: SelfInspectionsListComponent },
      { path: "new", component: CreateEditSelfInspectionComponent },
      { path: ":selfInspectionId", component: SelfInspectionComponent },
      { path: ":selfInspectionId/edit", component: CreateEditSelfInspectionComponent },
      { path: ":selfInspectionId/:date", component: TakeSelfInspectionComponent },
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    SelfInspectionsComponent,
    SelfInspectionsListComponent,
    SelfInspectionComponent,
    CreateEditSelfInspectionComponent,
    TakeSelfInspectionComponent
  ],
  providers: [SelfInspectionsService]
})
export class SelfInspectionsModule {}
