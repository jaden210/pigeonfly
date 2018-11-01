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

  searchStr; // template variable
  filterUsers; // template variable

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
    this.accountService.teamUsersObservable.subscribe(team => {
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
          surveys.forEach(survey => {
            survey['ranNumber'] = 0;
            Object.keys(survey.userSurvey).forEach(key => {
              if (survey.userSurvey[key] > 0) survey['ranNumber'] = survey['ranNumber'] + 1;
            })
            survey['ranPercent'] = survey['ranNumber'] / this.accountService.teamUsers.length;
          })
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

  
  selectSurvey(survey) {
    this.aSurvey = survey;
    this.surveyUsers = [];
    let surveyResponses  = this.accountService.db.collection("survey-response", ref => ref.where("surveyId", "==", survey.id));
    surveyResponses.valueChanges().subscribe(responses => {
      this.surveyUsers = responses;
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
      !this.aSurvey.id ? this.createSurvey() :
      this.accountService.db.collection("survey").doc(this.aSurvey.id).update({...this.aSurvey}).then(() => this.aSurvey = null);
    } else {
      this.aSurvey = null;
    }
  }

  createSurvey() {
      this.aSurvey.teamId = this.accountService.aTeam.id;
      this.aSurvey.createdAt = new Date();
      this.accountService.teamUsers.forEach(user => {
        this.aSurvey.userSurvey[user.id] = 0; 
      })
      this.accountService.db.collection("survey").add({...this.aSurvey}).then(snapshot => {
        this.aSurvey = null;
      });
      this.create = false;
  }
  
  deleteSurvey() {
    this.accountService.db.collection("survey").doc(this.aSurvey.id).delete().then(() => {
      this.aSurvey = null;
      let snackbar = this.snackbar.open("survey deleted", null, {
        duration: 3000
      });
    });
  }

}
