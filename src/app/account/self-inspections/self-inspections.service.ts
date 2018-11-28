import { Injectable, Component } from "@angular/core";
import { Observable } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { map, tap, take, mergeMap } from "rxjs/operators";
import { AccountService } from "../account.service";
import { MatDialogRef } from "@angular/material";

@Injectable({
  providedIn: "root"
})
export class SelfInspectionsService {

  selfInspection: SelfInspection;
  takeInspection: Inspection;

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

  getInspections(): Observable<Inspection[]> {
    let inspectionsCollection = this.accountService.db.collection<Inspection[]>(`team/${this.accountService.aTeam.id}/self-inspection`).doc(this.selfInspection.id).collection("inspections")
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
    
  setSelfInspectionWithTemplate(): void {
    let tempBaseQuestions = [];
    let templateDoc = this.accountService.db.collection<Categories[]>("osha-assesment-template-en", ref => ref.orderBy("order", "asc")); // get the template
    templateDoc.snapshotChanges().pipe(
      take(1),
      map(actions => 
        actions.map(a => {
          const data = a.payload.doc.data() as any;
          const id = a.payload.doc.id;
          if (this.selfInspection) {
            let tempSubject = this.selfInspection.baseQuestions.find(category => category.subject === data.subject);
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
      this.selfInspection.baseQuestions = tempBaseQuestions;
    });
  }

  saveOrCreateNewSelfInspection(): Promise<any> { //wish I could get this to work the other way around
    let baseQuestions: Categories[] = [];
    this.selfInspection.baseQuestions.forEach(category => {
      let newQuestions: Question[] = [];
      category.questions.forEach(question => {
        if (question.selected)
        newQuestions.push({name: question.name});
      });
      if (newQuestions.length > 0)
      baseQuestions.push({subject: category.subject, questions: newQuestions});
    });
    this.selfInspection.baseQuestions = baseQuestions;
    if (this.selfInspection.id) {
      return this.db.collection(`team/${this.accountService.aTeam.id}/self-inspection`).doc(this.selfInspection.id).set({...this.selfInspection});
    } else {
      this.selfInspection.teamId = this.accountService.aTeam.id;
      this.selfInspection.createdAt = new Date();
      return this.accountService.db.collection(`team/${this.accountService.aTeam.id}/self-inspection`).add({...this.selfInspection});
    }
  }

  deleteSelfInspection(): Promise<any> {
    let promises = [];
    this.selfInspection.inspections.forEach((inspection) => {
      let i = this.deleteSelfInspectionInspection(inspection);
      promises.push(i);
    })
    return Promise.all(promises).then(() => {
      return this.accountService.db.collection(`team/${this.accountService.aTeam.id}/self-inspection`).doc(this.selfInspection.id).delete();
    });
  }
  
  startInspection(): Promise<Inspection> {
    let inspection = new Inspection();
    inspection.createdAt = new Date();
    inspection.categories = this.selfInspection.baseQuestions;
    return this.accountService.db.collection(`team/${this.accountService.aTeam.id}/self-inspection`).doc(this.selfInspection.id).collection('inspections').add({...inspection}).then(snapshot => {
      inspection.id = snapshot.id;
      return inspection;
    });
  }
  
  deleteSelfInspectionInspection(inspection?) {
    return this.accountService.db
    .collection(`team/${this.accountService.aTeam.id}/self-inspection`)
    .doc(this.selfInspection.id)
    .collection("inspections")
    .doc(inspection.id || this.takeInspection.id).delete();
  }

  finishSelfInspection(): Promise<any> {
    this.takeInspection.completedAt = new Date();
    this.takeInspection.teamId = this.accountService.aTeam.id;
    this.takeInspection.completedBy = this.accountService.user.id;
    return this.saveSelfInspection();
  }

  saveSelfInspection(): Promise<any> {
    return this.accountService.db
    .collection(`team/${this.accountService.aTeam.id}/self-inspection`)
    .doc(this.selfInspection.id)
    .collection("inspections")
    .doc(this.takeInspection.id)
    .set({...this.takeInspection});
  }
}

export class SelfInspection {
  id?: string;
  teamId: string;
  createdAt: Date;
  title: string;
  baseQuestions: Categories[] = [];
  inspections: Inspection[] = [];
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

@Component({
  selector: "app-map-dialog",
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