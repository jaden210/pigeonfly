import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Routes, RouterModule } from "@angular/router";
import { SurveysComponent } from "./surveys.component";
import { SharedModule } from "../../shared-module";
import { SurveyComponent } from "./survey/survey.component";
import { SurveySearchPipe } from "./search.pipe";
import { SurveysListComponent } from "./surveys-list/surveys-list.component";
import { SurveysService } from "./surveys.service";
import { CreateSurveyDialogComponent } from "./create-survey-dialog/create-survey-dialog.component";
import { PeopleDialogComponent } from "./surveys-list/people-dialog.component";

const routes: Routes = [
  {
    path: "",
    component: SurveysComponent,
    children: [
      { path: "", component: SurveysListComponent },
      { path: ":surveyId", component: SurveyComponent }
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
    SurveysComponent,
    SurveyComponent,
    SurveySearchPipe,
    SurveysListComponent,
    CreateSurveyDialogComponent,
    PeopleDialogComponent
  ],
  entryComponents: [CreateSurveyDialogComponent, PeopleDialogComponent],
  providers: [SurveysService]
})
export class SurveysModule {}
