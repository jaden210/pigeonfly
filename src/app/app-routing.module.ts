import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { PricingComponent } from "./pricing/pricing.component";
import { AboutComponent } from "./about/about.component";
import { ContactComponent } from "./contact/contact.component";
import { SupportComponent } from "./support/support.component";
import { SignUpPageComponent } from "./sign-up-page/sign-up-page.component";
import { SignInComponent } from "./sign-in/sign-in.component";
import { HowComponent } from "./how/how.component";
import { TermsOfUseComponent } from "./terms-of-use/terms-of-use.component";
import { PrivacyPolicyComponent } from "./privacy-policy/privacy-policy.component";
import { CustomerAgreementComponent } from "./customer-agreement/customer-agreement.component";
import { AuthGuard } from "./auth.gaurd";
import { JoinTeamComponent } from "./join-team/join-team.component";

const routes: Routes = [
  { path: "", redirectTo: "home", pathMatch: "full" },
  { path: "home", component: HomeComponent },
  { path: "pricing", component: PricingComponent },
  { path: "about", component: AboutComponent },
  { path: "contact", component: ContactComponent },
  { path: "support", component: SupportComponent },
  { path: "how-it-works", component: HowComponent },
  { path: "sign-up", component: SignUpPageComponent },
  { path: "sign-in", component: SignInComponent },
  {
    path: "get-started",
    loadChildren: "./get-started/get-started.module#GetStartedModule"
  },
  { path: "terms-of-service", component: TermsOfUseComponent },
  { path: "privacy-policy", component: PrivacyPolicyComponent },
  { path: "customer-agreement", component: CustomerAgreementComponent },
  { path: "join-team", component: JoinTeamComponent },
  {
    path: "account",
    loadChildren: "./account/account.module#AccountModule",
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
