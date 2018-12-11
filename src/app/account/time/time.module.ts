import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { SharedModule } from "../../shared-module";
import { TimeComponent } from "./time.component";
import { TimeService } from "./time.service";
import { CreateEditShiftDialog } from "./create-edit-shift/create-edit-shift.dialog";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { SearchDialog } from "./search-dialog/search.dialog";

const routes: Routes = [
  {
    path: "",
    component: TimeComponent
  }
];

@NgModule({
  imports: [SharedModule, DragDropModule, RouterModule.forChild(routes)],
  declarations: [TimeComponent, CreateEditShiftDialog, SearchDialog],
  entryComponents: [CreateEditShiftDialog, SearchDialog],
  providers: [TimeService]
})
export class TimeModule {}
