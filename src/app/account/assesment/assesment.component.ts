import { Component, OnInit } from '@angular/core';
import { trigger, style, transition, animate } from "@angular/animations";
import { AccountService } from '../account.service';
import { MatSnackBar } from '@angular/material';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-assesment',
  templateUrl: './assesment.component.html',
  styleUrls: ['./assesment.component.css'],
  animations: [
    trigger("assesment", [
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
export class AssesmentComponent implements OnInit {

  assesments: any;
  assesmentTemplate;
  aAssesment: any = null;
  aSelfInspection: SelfInspection = null;

  newQ: string; //tepmplate variable
  takeBtnStr: string = 'TAKE'; //tepmplate variable
  takeInspection: boolean = false; //tepmplate variable

  constructor(
    public accountService: AccountService,
    public snackbar: MatSnackBar
  ) {
    this.accountService.helper = this.accountService.helperProfiles.osha;
    this.accountService.aTeamObservable.subscribe(team => {
      if (team) {
        let assesmentCollection = this.accountService.db.collection("assesment", ref => ref.where("teamId", "==", this.accountService.aTeam.id).orderBy("createdAt", "desc"));
        assesmentCollection.snapshotChanges().pipe(
          map(actions => {
            return actions.map(a => {
              let data:any = a.payload.doc.data();
              return {
                ...data,
                id: a.payload.doc.id,
                createdAt: data["createdAt"].toDate()
              };
            });
          })
        ).subscribe(assesments => {
          if (assesments.length == 0) this.accountService.showHelper = true;
          this.assesments = assesments;
        });
        let templateDoc = this.accountService.db.collection("osha-assesment-template-en"); // get the template
        templateDoc.snapshotChanges().pipe(
          map(actions => {
            return actions.map(a => {
              let data:any = a.payload.doc.data();
              return {
                ...data,
                id: a.payload.doc.id
              };
            });
          })
        ).subscribe(template => {
          this.assesmentTemplate = template;
          template.forEach(subject => {
            let questionsCollection = this.accountService.db.collection("osha-assesment-template-en").doc(subject.id).collection("questions");
            questionsCollection.snapshotChanges().pipe(
              map(actions => {
                return actions.map(a => {
                  let data:any = a.payload.doc.data();
                  return {
                    ...data,
                    id: a.payload.doc.id
                  };
                });
              })
            ).subscribe(questions => {
              subject.questions = questions;
            })
          });
        })
      }
    });
  }
  
  ngOnInit() {
  }
  
  startNewAssesment() {
    this.aAssesment = new Assesment();
    this.aAssesment.assesment = this.assesmentTemplate;
  }
  
  selectAssesment(assesment) {
    this.aAssesment = assesment;
    // get all self inspections for assesment
    let openInspectionCollection = this.accountService.db.collection("self-inspection", ref => ref.where("assesmentId", "==", assesment.id));
    openInspectionCollection.snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          let data:any = a.payload.doc.data();
          let completedAt = data["completedAt"] ? data["completedAt"].toDate() : null
          return {
            ...data,
            id: a.payload.doc.id,
            createdAt: data["createdAt"].toDate(),
            completedAt
          };
        });
      })
    ).subscribe(selfInspections => {
      this.aAssesment.selfInspections = selfInspections;
      // check to see if they have an unfinished take
      selfInspections.forEach(inspection => {
        if (!inspection.completed) {
          this.takeBtnStr = 'CONTINUE TAKING';
          this.aSelfInspection = inspection;
        } else {
          this.takeBtnStr = "TAKE";
        } 
      })
    })
  }
  
  getLength(q) { // could be better
    let i = 0;
    q.forEach(q => {
      q.selected ? i ++ : null;
    });
    return i;
  }
  
  getTakeLength(q) { // could be better
    let i = 0;
    q.forEach(q => {
      q.response ? i ++ : null;
    });
    return i;
  }

  addQuestion(index) {
    this.aAssesment.assesment[index].questions.push({
      name: this.newQ,
      selected: true
    });
    this.newQ = '';
  }

  take() {
    if (!this.aSelfInspection) {
      this.aSelfInspection = {...this.aAssesment}; // they are close.
      this.aSelfInspection.id = null;
      this.aSelfInspection.assesmentId = this.aAssesment.id;
      this.aSelfInspection.completed = false;
      let strippedAssesment = [];
      this.aSelfInspection.assesment.forEach(sect => {
        let strippedSect = sect;
        let strippedQuestions = [];
        sect.questions.forEach(q => {
          if (q.selected) {
            strippedQuestions.push(q);
          }
        });
        strippedSect.questions = strippedQuestions;
        if (strippedSect.questions.length > 0) strippedAssesment.push(strippedSect);
      });
      this.aSelfInspection.assesment = strippedAssesment;
    }
    this.takeInspection = true;
  }

  deleteTake() {
    if (this.aSelfInspection.id) { // remove from db
      let snackbar = this.snackbar.open("deleting", "undo", {
        duration: 6000
      });
      snackbar.afterDismissed().subscribe(action => {
        if (!action.dismissedByAction) {
          this.accountService.db.collection("self-inspection").doc(this.aSelfInspection.id).delete();
        }
      });
    }
    this.stopTake();
  }
  
  finishTake() {
    this.aSelfInspection.completed = true;
    this.aSelfInspection.completedAt = new Date();
    this.saveLeaveTake;
  }
  
  saveLeaveTake() {
    if (this.aSelfInspection.id) { // update
      this.accountService.db.collection("self-inspection").doc(this.aSelfInspection.id).update({... this.aSelfInspection}).then(() => {
        this.stopTake();
      });
    } else { // add
      this.accountService.db.collection("self-inspection").add({... this.aSelfInspection}).then(() => {
        this.stopTake();
      });
    }
  }
  
  stopTake() {
    this.aSelfInspection = null;
    this.takeInspection = false;
  }
  
  cancel() {
    this.aAssesment = null;
  }
  
  delete() {
    if (this.aAssesment.id) { // remove from db
      let snackbar = this.snackbar.open("deleting", "undo", {
        duration: 6000
      });
      snackbar.afterDismissed().subscribe(action => {
        if (!action.dismissedByAction) {
          this.accountService.db.collection("assesment").doc(this.aAssesment.id).delete().then(() => this.aAssesment == null);
        } else {
          this.aAssesment = null;
        }
      });
    }
  }

  save() {
    if (this.aAssesment.id) { //update
      this.accountService.db.collection("assesment").doc(this.aAssesment.id).update({... this.aAssesment}).then(() => this.aAssesment = null);
    } else { // create
      this.aAssesment.teamId = this.accountService.aTeam.id;
      this.aAssesment.createdAt = new Date();
      this.accountService.db.collection("assesment").add({...this.aAssesment}).then(() => this.aAssesment = null);
    }
  }

}

export class Assesment {
  id?: string;
  title: string;
  assesment?: any;
  teamId: string;
  createdAt: Date;
}

export class SelfInspection {
  id?: string;
  title: string;
  assesmentId: string;
  assesment?: any;
  teamId: string;
  createdAt: Date;
  completedAt?: Date;
  completed: boolean = false;
}