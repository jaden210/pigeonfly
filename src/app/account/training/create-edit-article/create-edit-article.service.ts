import { Injectable } from "@angular/core";
import { of, Observable } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { map, catchError, take, tap } from "rxjs/operators";
import { Article, TrainingService } from "../training.service";

@Injectable()
export class CreateEditArticleService {
  constructor(
    public db: AngularFirestore,
    private trainingService: TrainingService
  ) {}

  /* if the article id contains the teamId, pull from team/article collection */
  public getArticle(articleId: string, teamId): Observable<Article> {
    const ref = articleId.includes(teamId)
      ? this.db.collection(`team/${teamId}/article`)
      : this.db.collection("article");
    return ref
      .doc(articleId)
      .valueChanges()
      .pipe(
        map(article => {
          article["id"] = articleId;
          return article;
        }),
        catchError(error => {
          console.error(`Error loading article ${articleId}. ${error}`);
          alert(`Error loading article ${articleId}`);
          return of(null);
        })
      );
  }

  /* If the article is created by one of us, add to the article collection
  else add to team/article collection. This should also be favorited */
  public createArticle(article: Article, teamId, isGlobal): Promise<any> {
    const ref = isGlobal
      ? this.db.collection("article")
      : this.db.collection(`team/${teamId}/article`);
    const id = isGlobal ? ref.ref.doc().id : `${teamId}_${ref.ref.doc().id}`;
    return ref
      .doc(id)
      .set({ ...article })
      .then(() => {
        article.id = id;
        this.trainingService.favorite(article, teamId);
        return id;
      })
      .catch(error => {
        console.error(`Error creating article ${article.name}`, article, error);
        alert(`Error creating article ${article.name}`);
      });
  }

  /* Also need to update article names in myContent */
  public updateArticle(article: Article, teamId): Promise<any> {
    let art = { ...article };
    const id = art.id;
    delete art.id;
    const ref = id.includes(teamId)
      ? this.db.collection(`team/${teamId}/article`)
      : this.db.collection("article");
    return ref
      .doc(article.id)
      .update({ ...article })
      .then(() => {
        this.trainingService.getMyContent(teamId).subscribe(myContent => {
          const needsUpdate = myContent.filter(mc => mc.articleId == id);
          needsUpdate.forEach(nu => {
            nu.articleName = art.name || null;
            nu.articleNameEs = art.nameEs || null;
            this.trainingService.updateMyContent(nu, teamId);
          });
        });
        return id;
      })
      .catch(error => {
        console.error(`Error updating article ${article.name}`, article, error);
        alert(
          `Error updating article ${article.name}, falling back to original.`
        );
      });
  }

  public checkSlugIsValid(article): Observable<boolean> {
    return this.db.collection("article", ref => ref.where("slugName", "==", article.slugName))
    .valueChanges()
    .pipe(map((r: any) => {
      if (r.length) {
        return (r.length == 1 && r[0].id == article.id) ? true : false;
      } else {
        return true;
      } 
    }
    ));
  }

  /* If article is deleted, set myContent.disabled, wipe articles */
  public deleteArticle(articleId, teamId): Promise<any> {
    const ref = articleId.includes(teamId)
      ? this.db.collection(`team/${teamId}/article`)
      : this.db.collection("article");
    return ref
      .doc(articleId)
      .delete()
      .then(() => {
        this.trainingService.wipeArticles();
        this.trainingService.getMyContent(teamId).subscribe(myContent => {
          const needsUpdate = myContent.filter(mc => mc.articleId == articleId);
          needsUpdate.forEach(nu => {
            nu.disabled = true;
            this.trainingService.updateMyContent(nu, teamId);
          });
        });
        return articleId;
      })
      .catch(error => {
        console.error("Error deleting article", error);
        throw error;
      });
  }
}
