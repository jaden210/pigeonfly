import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PricingComponent } from './pricing/pricing.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { SupportComponent } from './support/support.component';
import { LoginComponent } from './login/login.component';
import { MakeOSHAComponent } from './make-osha/make-osha.component';
import { AssesComponent } from './ases/make-osha.component';
import { HowComponent } from './how/how.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'pricing', component: PricingComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'support', component: SupportComponent },
  { path: 'how-it-works', component: HowComponent },
  { path: 'login', component: LoginComponent },
  { path: 'ken-page', component: MakeOSHAComponent },
  { path: 'osha-assesment', component: AssesComponent },
  { path: 'account', loadChildren: './account/account.module#AccountModule' }
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
