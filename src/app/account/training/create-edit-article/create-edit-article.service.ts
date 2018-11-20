import { Injectable } from "@angular/core";
import { of, Observable, combineLatest } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { AngularFireStorage } from "@angular/fire/storage";
import { map, catchError, switchMap } from "rxjs/operators";
import { Article, Topic } from "../training.service";

@Injectable({
  providedIn: "root"
})
export class CreateEditArticleService {
  constructor(
    public db: AngularFirestore,
    public storage: AngularFireStorage
  ) {}

  public getArticle(articleId: string, teamId): Observable<Article[]> {
    console.log(articleId);
    return combineLatest(
      this.db
        .collection(`team/${teamId}/article`)
        .doc(articleId)
        .valueChanges(),
      this.db
        .collection("article")
        .doc(articleId)
        .valueChanges()
    ).pipe(
      map(topics => topics.filter(a => a)),
      catchError(error => {
        console.error(`Error loading article ${articleId}. ${error}`);
        alert(`Error loading article ${articleId}`);
        return of(null);
      })
    );
  }

  public createArticle(article: Article, teamId, isGlobal): Promise<any> {
    const ref = isGlobal
      ? this.db.collection("article")
      : this.db.collection(`team/${teamId}/article`);
    return ref
      .add({ ...article })
      .then(ref => ref.id)
      .catch(error => {
        console.error(`Error creating article ${article.name}`, article, error);
        alert(`Error creating article ${article.name}`);
      });
  }

  public updateArticle(article: Article, teamId, isGlobal): Promise<any> {
    // also need to update article names in myContent, training level on myContent
    const ref = isGlobal
      ? this.db.collection("article")
      : this.db.collection(`team/${teamId}/article`);
    return ref
      .doc(article.id)
      .update({ ...article })
      .catch(error => {
        console.error(`Error updating article ${article.name}`, article, error);
        alert(
          `Error updating article ${article.name}, falling back to original.`
        );
      });
  }

  public deleteArticle(articleId, teamId, isGlobal): Promise<any> {
    const ref = isGlobal
      ? this.db.collection("article")
      : this.db.collection(`team/${teamId}/article`);
    return ref
      .doc(articleId)
      .delete()
      .catch(error => {
        console.error("Error deleting article", error);
        throw error;
      });
  }

  public getTopics(): Observable<Topic[]> {
    return this.db
      .collection("topic")
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = <Topic>a.payload.doc.data();
            const id = a.payload.doc.id;
            return { ...data, id };
          })
        ),
        map(topics => {
          return topics.sort((a, b) =>
            a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
          );
        }),
        catchError(error => {
          console.error(`Error loading topics collection. ${error}`);
          alert(`Error loading topics collection for `);
          return of([]);
        })
      );
  }
}
