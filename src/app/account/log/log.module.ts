import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { SharedModule } from "../../shared-module";
import { LogComponent } from "./log.component";
import { LogService } from "./log.service";
import { SearchDialog } from "./search-dialog/search.dialog";

const routes: Routes = [
  {
    path: "",
    component: LogComponent
  }
];

@NgModule({
  imports: [SharedModule, RouterModule.forChild(routes)],
  declarations: [LogComponent, SearchDialog],
  entryComponents: [SearchDialog],
  providers: [LogService]
})
export class LogModule {}
