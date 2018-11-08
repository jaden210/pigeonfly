import { Injectable } from "@angular/core";
import { BehaviorSubject, of, Observable } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { AngularFireStorage } from "@angular/fire/storage";
import { map, catchError } from "rxjs/operators";
import { Article, Topic } from "../training.service";

@Injectable({
  providedIn: "root"
})
export class CreateEditArticleService {
  constructor(
    public db: AngularFirestore,
    public storage: AngularFireStorage
  ) {}

  public getArticle(articleId: string): Observable<Article> {
    return this.db
      .collection("article")
      .doc(articleId)
      .snapshotChanges()
      .pipe(
        map(a => {
          const data = <Article>a.payload.data();
          const id = a.payload.id;
          return { ...data, id };
        }),
        catchError(error => {
          console.error(`Error loading article ${articleId}. ${error}`);
          alert(`Error loading article ${articleId}`);
          return of(new Article());
        })
      );
  }

  public createArticle(article: Article): Promise<any> {
    return this.db
      .collection("article")
      .add({ ...article })
      .catch(error => {
        console.error(`Error creating article ${article.name}`, article, error);
        alert(`Error creating article ${article.name}`);
      });
  }

  public updateArticle(article: Article): Promise<any> {
    // also need to update article names, training level on myContent
    return this.db
      .collection("article")
      .doc(article.id)
      .update({ ...article })
      .catch(error => {
        console.error(`Error updating article ${article.name}`, article, error);
        alert(
          `Error updating article ${article.name}, falling back to original.`
        );
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
          return topics.sort(
            (a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1)
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
