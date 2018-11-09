import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountComponent } from './account.component';
import { MatIconModule, MatListModule, MatSidenavModule, MatFormFieldModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { AccountRoutingModule } from './account-routing.module';
import { HomeComponent } from '../home/home.component';
import { AssesmentComponent } from './assesment/assesment.component';
import { EventComponent } from './event/event.component';
import { ImagesDialogComponent } from './images-dialog/images-dialog.component';
import { IncidentReportsComponent } from './incident-reports/incident-reports.component';
import { LogComponent } from './log/log.component';
import { MapDialogComponent } from './map-dialog/map-dialog.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { SurveyComponent } from './surveys/survey/survey.component';
import { TimeComponent } from './time/time.component';
import { ToolbarHelperComponent } from './toolbar-helper/toolbar-helper.component';
import { TrainingComponent } from './training/training.component';
import { StatsComponent } from './stats/stats.component';
import { AssesComponent } from './stats/ases/make-osha.component';

describe('AccountComponent', () => {
  let component: AccountComponent;
  let fixture: ComponentFixture<AccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ 
        AccountComponent
       ],
      imports: [
        MatIconModule,
        MatListModule,
        MatSidenavModule,
        MatFormFieldModule,
        FormsModule,
        AccountRoutingModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
