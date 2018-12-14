import { Injectable, Component } from "@angular/core";
import { Observable } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { map, tap, take, mergeMap } from "rxjs/operators";
import { AccountService } from "../account.service";
import { MatDialogRef } from "@angular/material";

@Injectable()
export class SelfInspectionsService {

  constructor(
    public db: AngularFirestore,
    private accountService: AccountService
  ) {}

  getSelfInspections(): Observable<SelfInspection[]> {
    let assesmentCollection = this.accountService.db.collection<SelfInspection[]>(`team/${this.accountService.aTeam.id}/self-inspection`, ref => ref.orderBy("createdAt", "desc"));
    return assesmentCollection.snapshotChanges().pipe(
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
    )
  }

  getSelfInspection(id): Observable<SelfInspection> {
    let selfInspectionDoc = this.accountService.db.doc(`team/${this.accountService.aTeam.id}/self-inspection/${id}`);
    return selfInspectionDoc.snapshotChanges().pipe(
      map((actions: any) => {
        let data = actions.payload.data();
        data["id"] = actions.payload.id;
        data["createdAt"] = data.createdAt.toDate();
        return data;
      })
    )
  }

  getSelfInspectionInspection(siId, iId): Observable<Inspection> {
    let selfInspectionDoc = this.accountService.db.doc(`team/${this.accountService.aTeam.id}/self-inspection/${siId}/inspections/${iId}`);
    return selfInspectionDoc.snapshotChanges().pipe(
      map((actions: any) => {
        let data = actions.payload.data();
        data["id"] = actions.payload.id;
        data["createdAt"] = data.createdAt.toDate();
        return data;
      })
    )
  }

  getInspections(selfInspectionId): Observable<Inspection[]> {
    let inspectionsCollection = this.accountService.db.collection<Inspection[]>(`team/${this.accountService.aTeam.id}/self-inspection/${selfInspectionId}/inspections`, ref =>
    ref.orderBy("createdAt", "desc"));
    return inspectionsCollection.snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          let data:any = a.payload.doc.data();
          return {
            ...data,
            id: a.payload.doc.id,
            createdAt: data["createdAt"].toDate(),
            completedAt: data["completedAt"] ? data["completedAt"].toDate() : null
          };
        });
      })
    )
  }
    
  setSelfInspectionWithTemplate(selfInspection?): void {
    let tempBaseQuestions = [];
    let templateDoc = this.accountService.db.collection<Categories[]>("osha-assesment-template-en", ref => ref.orderBy("order", "asc")); // get the template
    templateDoc.snapshotChanges().pipe(
      take(1),
      map(actions => 
        actions.map(a => {
          const data = a.payload.doc.data() as any;
          const id = a.payload.doc.id;
          if (selfInspection) {
            let tempSubject = selfInspection.baseQuestions.find(category => category.subject === data.subject);
            if (tempSubject && tempSubject.questions) {
              tempSubject.questions.forEach(question => {
                let tQ = data.questions.find(tempQ => tempQ.name == question.name);
                if (tQ) {
                  tQ.selected = true;
                } else {
                  question.selected = true;
                  data.questions.push(question);
                };
              });
            }
          }
          tempBaseQuestions.push(data);
          return { ...data, id }
        })
      )
    ).subscribe(() => {
      selfInspection.baseQuestions = tempBaseQuestions;
    });
  }

  saveOrCreateNewSelfInspection(selfInspection): Promise<any> { //wish I could get this to work the other way around
    let baseQuestions: Categories[] = [];
    selfInspection.baseQuestions.forEach(category => {
      let newQuestions: Question[] = [];
      category.questions.forEach(question => {
        if (question.selected)
        newQuestions.push({name: question.name});
      });
      if (newQuestions.length > 0)
      baseQuestions.push({subject: category.subject, questions: newQuestions});
    });
    selfInspection.baseQuestions = baseQuestions;
    if (selfInspection.id) {
      return this.db.collection(`team/${this.accountService.aTeam.id}/self-inspection`).doc(selfInspection.id).set({...selfInspection});
    } else {
      selfInspection.teamId = this.accountService.aTeam.id;
      selfInspection.createdAt = new Date();
      return this.accountService.db.collection(`team/${this.accountService.aTeam.id}/self-inspection`).add({...selfInspection});
    }
  }

  deleteSelfInspection(selfInspection, selfInspectionInspections): Promise<any> {
    let promises = [];
    selfInspectionInspections.forEach((inspection) => {
      let i = this.deleteSelfInspectionInspection(inspection, selfInspection);
      promises.push(i);
    })
    return Promise.all(promises).then(() => {
      return this.accountService.db.collection(`team/${this.accountService.aTeam.id}/self-inspection`).doc(selfInspection.id).delete();
    });
  }
  
  startInspection(selfInspection): Promise<Inspection> {
    let newInspection = new Inspection();
    newInspection.createdAt = new Date();
    newInspection.categories = selfInspection.baseQuestions;
    return this.accountService.db.collection(`team/${this.accountService.aTeam.id}/self-inspection/${selfInspection.id}/inspections`).add({...newInspection}).then(snapshot => {
      newInspection.id = snapshot.id;
      return newInspection;
    });
  }
  
  deleteSelfInspectionInspection(inspection, selfInspection) {
    return this.accountService.db.doc(`team/${this.accountService.aTeam.id}/self-inspection/${selfInspection.id}/inspections/${inspection.id}`).delete();
  }

  finishSelfInspection(inspection, selfInspection): Promise<any> {
    inspection.completedAt = new Date();
    inspection.teamId = this.accountService.aTeam.id;
    inspection.completedBy = this.accountService.user.id;
    selfInspection.lastCompletedAt = new Date();
    this.db.doc(`team/${this.accountService.aTeam.id}/self-inspection/${selfInspection.id}`).update({...selfInspection});
    return this.saveSelfInspection(inspection, selfInspection);
  }

  saveSelfInspection(inspection, selfInspection): Promise<any> {
    return this.accountService.db.doc(`team/${this.accountService.aTeam.id}/self-inspection/${selfInspection.id}/inspections/${inspection.id}`).set({...inspection});
  }
}

export class SelfInspection {
  id?: string;
  teamId: string;
  createdAt: any;
  title: string;
  baseQuestions: Categories[] = [];
  inspectionExpiration?: string;
  lastCompletedAt?: any;
}

export class Inspection {
  id?: string;
  createdAt: any;
  completedAt?: any;
  categories: Categories[] = [];
  completedPercent: number = 0;
  compliantPercent: number = 0;
  teamId?: string;
  completedBy?: string;
}

export class Categories {
  id?: string;
  order?: number;
  subject: string;
  questions: Question[] = [];
  show?: boolean; // used in html
  finished?: boolean = false; // used in html
}

export class Question {
  id?: string;
  name: string;
  selected?: boolean;
  answer?: boolean;
  comment?: string;
}

export enum ExperationTimeFrame {
  Anually = "Anually",
  SemiAnually = "Semi-Anually",
  Quarterly = "Quarterly",
  Montly = "Monthly"
}

@Component({
  template: `
  <h2 mat-dialog-title>Are you sure?</h2>
  <mat-dialog-content>Are you sure you want to delete this self-inspection? All data related to this self-inspection will be lost.</mat-dialog-content>
  <mat-dialog-actions style="margin-top:12px" align="end"><button mat-button color="primary" style="margin-right:8px" (click)="close(false)">CANCEL</button>
  <button mat-raised-button color="warn" (click)="close(true)">DELETE</button>
  </mat-dialog-actions>
  `
})
export class DeleteInspectionDialog {
  constructor(
    public dialogRef: MatDialogRef<DeleteInspectionDialog>
  ) {}

  close(shouldDelete) {
    this.dialogRef.close(shouldDelete);
  }
}