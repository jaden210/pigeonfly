import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PricingComponent } from './pricing/pricing.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { WhyComponent } from './why/why.component';
import { LoginComponent } from './login/login.component';
import { MakeOSHAComponent } from './make-osha/make-osha.component';
import { AssesComponent } from './ases/make-osha.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'pricing', component: PricingComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'why', component: WhyComponent },
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
