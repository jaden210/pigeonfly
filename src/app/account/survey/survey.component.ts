import { Component, OnInit } from '@angular/core';
import { AccountService, Survey } from '../account.service';
import { map } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-survey',
  templateUrl: './survey.component.html',
  styleUrls: ['./survey.component.css']
})
export class SurveyComponent implements OnInit {

  surveys: Survey[];
  aSurvey: Survey = new Survey();

  week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  constructor(
    public accountService: AccountService,
    public snackbar: MatSnackBar
  ) {
    this.accountService.aTeamObservable.subscribe(team => {
      if (team) {
        let surveyCollection = this.accountService.db.collection<Survey[]>("survey", ref => ref.where("teamId", "==", this.accountService.aTeam.id).orderBy("createdAt", "desc"));
        surveyCollection.snapshotChanges().pipe(
          map(actions => {
            return actions.map(a => {
              let data:any = a.payload.doc.data();
              return <Survey>{
                ...data,
                id: a.payload.doc.id,
                createdAt: data["createdAt"].toDate()
              };
            });
          })
        ).subscribe(surveys => {
          this.surveys = surveys;
        });
      }
    });
  }

  ngOnInit() {
  }

  array(n: number): any[] {
    return Array(n);
  }

  createSurvey() {
    let survey = new Survey();
    survey.teamId = this.accountService.aTeam.id;
    survey.createdAt = new Date();
    this.accountService.db.collection("survey").add({...survey}).then(snapshot => {
      survey.id = snapshot.id;
      this.selectSurvey(survey);
    });
  }

  selectSurvey(survey) {
    this.aSurvey = survey;
  }

  checkIfChecked(d) { // terribly inefficient
    return d ? this.aSurvey.types[this.aSurvey.runType].indexOf(d) > -1 : null;
  }

  addTo(d) {
    if (this.aSurvey.types[this.aSurvey.runType].find(day => day == d)) {
      this.aSurvey.types[this.aSurvey.runType].splice(this.aSurvey.types[this.aSurvey.runType].indexOf(d), 1);
    } else {
      this.aSurvey.types[this.aSurvey.runType].push(d);
    }
  }

  saveSurvey(save) {
    if (save) {
      this.accountService.db.collection("survey").doc(this.aSurvey.id).update({...this.aSurvey}).then(() => this.aSurvey = new Survey());
    } else {
      this.aSurvey = new Survey();
    }
  }

  deleteSurvey() {
    this.accountService.db.collection("survey").doc(this.aSurvey.id).delete().then(() => {
      this.aSurvey = new Survey();
      let snackbar = this.snackbar.open("survey deleted", null, {
        duration: 3000
      });
    });
  }

}
