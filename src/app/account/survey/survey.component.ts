import { Component, OnInit } from '@angular/core';
import { trigger, style, transition, animate } from "@angular/animations";
import { AccountService, Survey, User } from '../account.service';
import { map } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-survey',
  templateUrl: './survey.component.html',
  styleUrls: ['./survey.component.css'],
  animations: [
    trigger("survey", [
      transition(":enter", [
        style({ transform: "translateY(100%)", opacity: 0 }),
        animate("250ms ease-out", style({ transform: "translateY(0)", opacity: 1 }))
      ]),
      transition(":leave", [
        style({ transform: "translateY(0)", opacity: 1 }),
        animate("250ms ease-in", style({ transform: "translateY(100%)", opacity: 0 }))
      ])
    ])
  ]
})
export class SurveyComponent implements OnInit {

  surveys: Survey[];
  aSurvey: Survey = null;
  surveyUsers;
  create: boolean = false; // template variable

  week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  constructor(
    public accountService: AccountService,
    public snackbar: MatSnackBar
  ) {
    this.accountService.helper = this.accountService.helperProfiles.survey;
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
          if (surveys.length == 0) this.accountService.showHelper = true;
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

  startNewSurvey() {
    this.aSurvey = new Survey();
    this.create = true;
  }

  createSurvey(d) {
    if (d) {
      this.aSurvey.teamId = this.accountService.aTeam.id;
      this.aSurvey.createdAt = new Date();
      this.accountService.db.collection("survey").add({...this.aSurvey}).then(snapshot => {
        this.aSurvey = new Survey();
      });
      this.create = false;
    } else {
      this.aSurvey = new Survey();
      this.create = false;
    }
  }

  selectSurvey(survey) {
    this.aSurvey = survey;
    this.surveyUsers = [];
    Object.keys(survey.userSurvey).forEach(key => {
      let user: any = this.accountService.teamUsers.find(user => user.id == key);
      if (survey.userSurvey[key] != 0) {
        let userSurveyDoc = this.accountService.db.collection("survey-response").doc(survey.userSurvey[key]);
        userSurveyDoc.valueChanges()
        .subscribe((surveyResponse: any) => {
          surveyResponse.createdAt = surveyResponse.createdAt.toDate();
          user.hasResponse = true;
          user.surveyResponse = surveyResponse;
          this.surveyUsers.push(user);
        });
      } else {
        user.hasResponse = false;
        this.surveyUsers.push(user);
      }
    })
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
      this.aSurvey = null;
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
