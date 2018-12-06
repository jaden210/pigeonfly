import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { SharedModule } from "../../shared-module";
import { TimeComponent } from "./time.component";
import { TimeService } from "./time.service";
import { CreateEditShiftDialog } from "./create-edit-shift/create-edit-shift.dialog";
import { NgxMaterialTimepickerModule } from "ngx-material-timepicker";
import { DragDropModule } from "@angular/cdk/drag-drop";

const routes: Routes = [
  {
    path: "",
    component: TimeComponent
  }
];

@NgModule({
  imports: [
    SharedModule,
    DragDropModule,
    RouterModule.forChild(routes),
    NgxMaterialTimepickerModule.forRoot()
  ],
  declarations: [TimeComponent, CreateEditShiftDialog],
  entryComponents: [CreateEditShiftDialog],
  providers: [TimeService]
})
export class TimeModule {}
