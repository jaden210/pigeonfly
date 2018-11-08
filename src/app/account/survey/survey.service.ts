import { Injectable } from "@angular/core";
import { of, Observable } from "rxjs";
import { AngularFirestore, DocumentReference } from "@angular/fire/firestore";
import { map, catchError } from "rxjs/operators";
import { Survey } from "./survey";
import { SurveyResponse } from "./survey-response";

@Injectable()
export class SurveyService {
  constructor(public db: AngularFirestore) {}

  /* will automatically unsubscribe with async pipe */
  public getSurveys(teamId): Observable<Survey[]> {
    return this.db
      .collection("survey", ref =>
        ref.where("teamId", "==", teamId).orderBy("createdAt", "desc")
      )
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = <any>a.payload.doc.data(),
              id = a.payload.doc.id,
              createdAt = data.createdAt.toDate();
            return { ...data, id, createdAt };
          })
        ),
        catchError(error => {
          console.error(`Error loading survey collection`, error);
          alert(`Error loading survey collection`);
          return of([]);
        })
      );
  }

  /* Jade, put take(1) before map in pipe if you don't care about realtime */
  public getSurveyResponses(surveyId): Observable<SurveyResponse[]> {
    return this.db
      .collection("survey-response", ref =>
        ref.where("surveyId", "==", surveyId)
      )
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = <any>a.payload.doc.data(),
              id = a.payload.doc.id,
              createdAt = data.createdAt.toDate();
            return { ...data, id, createdAt };
          })
        ),
        catchError(error => {
          console.error(`Error loading survey-response collection`, error);
          alert(`Error loading survey-response collection`);
          return of([]);
        })
      );
  }

  public updateSurvey(survey: Survey): Promise<void> {
    return this.db
      .collection("survey")
      .doc(survey.id)
      .update({ ...survey })
      .catch(error => {
        console.error("Error saving survey.", error);
        alert("Error saving survey");
        throw error;
      });
  }

  public createSurvey(survey: Survey): Promise<DocumentReference> {
    return this.db
      .collection("survey")
      .add({ ...survey })
      .catch(error => {
        console.error("Error creating survey.", error);
        alert("Error creating survey");
        throw error;
      });
  }

  public deleteSurvey(surveyId: string): Promise<void> {
    return this.db
      .collection("survey")
      .doc(surveyId)
      .delete()
      .catch(error => {
        console.error("Error deleting survey.", error);
        alert("Error deleting survey");
        throw error;
      });
  }
}
