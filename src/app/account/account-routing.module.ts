import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { AccountComponent } from "./account.component";
import { ProfileComponent } from "./account/account.component";
import { AuthGuard } from "./auth.gaurd";
import { PrintComponent } from "./print/print.component";

const routes: Routes = [
  {
    path: "",
    component: AccountComponent,
    children: [
      { path: "", redirectTo: "account", pathMatch: "full" },
      { path: "account", component: ProfileComponent },
      { path: "account/print", component: PrintComponent },
      { path: "print", component: PrintComponent },  
      {
        path: "support",
        loadChildren: "./support/support.module#SupportModule",
        canActivate: [AuthGuard]
      },
      { path: "**", redirectTo: "account" }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule {}
