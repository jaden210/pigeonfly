import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileComponent } from './account/account.component';
import { HomeComponent } from './home/home.component';
import { SurveyComponent } from './survey/survey.component';
import { TimeComponent } from './time/time.component';
import { LogComponent } from './log/log.component';
import { AssesmentComponent } from './assesment/assesment.component';
import { AccountRoutingModule } from './account-routing.module';
import { MaterialModule } from '../material/material.module';
import { AccountComponent } from './account.component';
import { CreateTeamComponent } from './create-team/create-team.component';
import { FormsModule } from '@angular/forms';
import { AgmCoreModule } from '@agm/core';
import { MomentModule } from 'angular2-moment';

@NgModule({
  imports: [
    CommonModule,
    AccountRoutingModule,
    MaterialModule,
    FormsModule,
    MomentModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyCg1x6Pm29QsCbzSb0Astep5D4_-KEXlSk',
      libraries: ['places']
    })
  ],
  declarations: [AccountComponent, ProfileComponent, HomeComponent, SurveyComponent, TimeComponent, LogComponent, AssesmentComponent, CreateTeamComponent],
  exports: [
    MaterialModule
  ]
})
export class AccountModule { }
