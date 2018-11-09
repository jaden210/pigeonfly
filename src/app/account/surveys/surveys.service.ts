import { Injectable } from "@angular/core";
import { of, Observable } from "rxjs";
import { AngularFirestore, DocumentReference } from "@angular/fire/firestore";
import { map, catchError, tap } from "rxjs/operators";
import { Survey } from "./survey/survey";
import { SurveyResponse } from "./survey-response";
import { AccountService } from "../account.service";

@Injectable()
export class SurveysService {
  survey: Survey;

  constructor(
    public db: AngularFirestore,
    private accountService: AccountService
  ) {}

  /* will automatically unsubscribe with async pipe */
  /* Should I cache these? */
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
            const runOnceOnDate = data.runOnceOnDate
              ? data.runOnceOnDate.toDate()
              : null;
            return { ...data, id, createdAt, runOnceOnDate };
          })
        ),
        map(actions => actions.sort(survey => (survey.active ? -1 : 1))),
        catchError(error => {
          console.error(`Error loading survey collection`, error);
          alert(`Error loading survey collection`);
          return of([]);
        })
      );
  }

  public getSurvey(surveyId): Observable<Survey> {
    return this.survey && this.survey.id == surveyId
      ? of(this.survey)
      : this.db
          .collection("survey")
          .doc(surveyId)
          .snapshotChanges()
          .pipe(
            map(action => {
              const data = <any>action.payload.data();
              const id = action.payload.id;
              const createdAt = data.createdAt.toDate();
              const runOnceOnDate = data.runOnceOnDate
                ? data.runOnceOnDate.toDate()
                : null;
              return { ...data, id, createdAt, runOnceOnDate };
            })
          );
  }

  public getSurveyResponses(surveyId): Observable<SurveyResponse[]> {
    return this.db
      .collection("survey-response", ref =>
        ref.where("surveyId", "==", surveyId).orderBy("createdAt", "desc")
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
    const id = survey.id;
    delete survey["user"];
    delete survey.id;
    return this.db
      .collection("survey")
      .doc(id)
      .update({ ...survey })
      .then(data => {return data})
      .catch(error => {
        console.error("Error updating survey.", error);
        alert("Error updating survey");
        throw error;
      });
  }

  public createSurvey(survey: Survey): Promise<DocumentReference> {
    return this.db
      .collection("survey")
      .add({ ...survey })
      .then(data => {
        return data;
      })
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
