import { Injectable } from "@angular/core";
import { of, Observable } from "rxjs";
import { AngularFirestore } from "angularfire2/firestore";
import { Router } from "@angular/router";
import { AngularFireStorage } from "angularfire2/storage";
import { map, catchError, tap, take, mergeMap } from "rxjs/operators";
import { AccountService } from "../account.service";
import { Survey } from "../survey/survey";

@Injectable({
  providedIn: "root"
})
export class TrainingService {
  private industries: Industry[] = [];
  private topics: Topic[] = [];
  private articles: Article[] = [];
  private myContent: MyContent[] = [];
  private activeRoute: string;

  constructor(
    public db: AngularFirestore,
    public storage: AngularFireStorage,
    public accountService: AccountService,
    public router: Router
  ) {}

  public getIndustries(): Observable<Industry[]> {
    return this.industries.length
      ? of(this.industries)
      : this.db
          .collection("industries", ref => ref.orderBy("name", "asc"))
          .snapshotChanges()
          .pipe(
            take(1),
            map(actions =>
              actions.map(a => {
                const data = <Industry>a.payload.doc.data();
                const id = a.payload.doc.id;
                return { ...data, id };
              })
            ),
            tap(industries => (this.industries = industries)),
            catchError(error => {
              console.error(`Error loading industries collection. ${error}`);
              alert(`Error loading industries collection`);
              return of([]);
            })
          );
  }

  /* will automatically unsubscribe with async pipe */
  public getTopics(industryId, forceRefresh = false): Observable<Topic[]> {
    if (forceRefresh) this.topics = [];
    const topics = this.topics.filter(t => t.industryIds.includes(industryId));
    return topics.length
      ? of(topics)
      : this.db
          .collection("topic", ref =>
            ref.where("industryIds", "array-contains", industryId)
          )
          .snapshotChanges()
          .pipe(
            take(1),
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
            tap(topics => (this.topics = topics)),
            catchError(error => {
              console.error(`Error loading topics collection. ${error}`);
              alert(`Error loading topics collection for `);
              return of([]);
            })
          );
  }

  public getArticles(topicId, teamId): Observable<Article[]> {
    const articles = this.articles.filter(a => a.topicIds.includes(topicId));
    return articles.length
      ? of(articles)
      : this.getMyContent(teamId).pipe(
          mergeMap(mYContent =>
            this.db
              .collection("article", ref =>
                ref.where("topicIds", "array-contains", topicId)
              )
              .snapshotChanges()
              .pipe(
                take(1),
                map(actions =>
                  actions.map(a => {
                    const data = <Article>a.payload.doc.data();
                    const id = a.payload.doc.id;
                    const myContent = mYContent.find(mc => mc.articleId == id);
                    const favorited = myContent ? !myContent.disabled : false;
                    return { ...data, id, myContent, favorited };
                  })
                ),
                map(articles => {
                  return articles.sort(
                    (a, b) =>
                      a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
                  );
                }),
                tap(articles => (this.articles = articles)),
                catchError(error => {
                  console.error(`Error loading articles collection. ${error}`);
                  alert(`Error loading articles collection`);
                  return of([]);
                })
              )
          )
        );
  }

  public getArticle(articleId, teamId): Observable<Article> {
    const article = this.articles.find(a => a.id == articleId);
    return article
      ? of(article)
      : this.getMyContent(teamId).pipe(
          mergeMap(mYContent =>
            this.db
              .collection("article")
              .doc(articleId)
              .snapshotChanges()
              .pipe(
                take(1),
                map(article => {
                  const data = <Article>article.payload.data();
                  const id = article.payload.id;
                  const myContent = mYContent.find(mc => mc.articleId == id);
                  const favorited = myContent ? !myContent.disabled : false;
                  return { ...data, id, myContent, favorited };
                }),
                catchError(error => {
                  console.error(`Error loading article. ${error}`);
                  alert(`Error loading article`);
                  return of(null);
                })
              )
          )
        );
  }

  public getMyContent(teamId): Observable<MyContent[]> {
    return this.myContent.length
      ? of(this.myContent)
      : this.db
          .collection("my-content", ref => ref.where("teamId", "==", teamId))
          .snapshotChanges()
          .pipe(
            take(1),
            map(actions =>
              actions.map(a => {
                const data = <MyContent>a.payload.doc.data();
                const id = a.payload.doc.id;
                const needsTraining = this.getExpiredTrainees(data);
                const complianceLevel = this.getComplianceLevel(
                  data.trainees,
                  needsTraining
                );
                return { ...data, id, needsTraining, complianceLevel };
              })
            ),
            tap(myContent => (this.myContent = myContent || [])),
            catchError(error => {
              console.error(`Error loading my-content collection. ${error}`);
              alert(`Error loading my-content collection`);
              return of([]);
            })
          );
  }

  /* Returns a percentage of people who are current of total trainees */
  private getComplianceLevel(
    trainees: object,
    needsTraining: string[]
  ): number {
    const t = trainees ? Object.keys(trainees).length : 0;
    const nt = needsTraining ? needsTraining.length : 0;
    return Math.floor((t - nt) / t) || 0;
  }

  /* Returns a list of userIds who need a refresh on their training */
  private getExpiredTrainees(myContent: MyContent): string[] {
    const expirationDate = this.getTrainingExpirationDate(
      myContent.trainingExpiration
    );
    const trainees = myContent.trainees || {};
    let expiredTrainees = [];
    Object.keys(trainees).forEach(trainee => {
      const lastTrainedDate = new Date(trainees[trainee]);
      if (lastTrainedDate < expirationDate) expiredTrainees.push(trainee);
    });
    return expiredTrainees;
  }

  /* Returns the latest date training should have occured in order to be compliant */
  public getTrainingExpirationDate(
    trainingExpiration: TrainingExpiration
  ): Date {
    switch (trainingExpiration) {
      case "Anually":
        return new Date(new Date().setFullYear(new Date().getFullYear() - 1));
      case "Semi-Anually":
        return new Date(new Date().setMonth(new Date().getMonth() - 6));
      case "Quarterly":
        return new Date(new Date().setMonth(new Date().getMonth() - 3));
      case "Monthly":
        return new Date(new Date().setMonth(new Date().getMonth() - 1));
      default:
        return null;
    }
  }

  public setActiveRoute(route: string): void {
    setTimeout(() => (this.activeRoute = route), 1);
  }

  public getActiveRoute(): string {
    return this.activeRoute || "";
  }

  /* Use this to get date to add as value for trainee */
  public getMostRecentTrainingForUserByArticle(
    userId,
    teamId,
    articleId
  ): Observable<Date[]> {
    return this.db
      .collection("survey", ref =>
        ref
          .where("teamId", "==", teamId)
          .where("OSHAArticleId", "==", articleId)
          .where("inAttendance", "array-contains", userId)
          .orderBy("inAttendance")
          .orderBy("createdAt", "desc")
          .limit(1)
      )
      .snapshotChanges()
      .pipe(
        take(1),
        map(actions =>
          actions.map(action => {
            const data = <Survey>action.payload.doc.data();
            return new Date(data.createdAt);
          })
        )
      );
  }

  public getTrainingHistoryForUserByArticle(
    userId,
    teamId,
    articleId
  ): Observable<Survey[]> {
    console.log(teamId, userId, articleId);
    return this.db
      .collection("survey", ref =>
        ref
          .where("teamId", "==", teamId)
          .where("OSHAArticleId", "==", articleId)
          .where("inAttendance", "array-contains", userId)
          .orderBy("createdAt", "desc")
      )
      .snapshotChanges()
      .pipe(
        take(1),
        map(actions =>
          actions.map(action => {
            const data = <any>action.payload.doc.data();
            const createdAt = data.createdAt.toDate();
            const user = this.accountService.teamUsers.find(
              u => u.uid == data.userId
            );
            const trainedBy = user ? user.name : "Anonymous";
            return { ...data, createdAt, trainedBy };
          })
        )
      );
  }

  public getTrainingHistoryByArticle(teamId, articleId): Observable<Survey[]> {
    return this.db
      .collection("survey", ref =>
        ref
          .where("teamId", "==", teamId)
          .where("OSHAArticleId", "==", articleId)
          .orderBy("createdAt", "desc")
      )
      .snapshotChanges()
      .pipe(
        take(1),
        map(actions =>
          actions.map(action => {
            const data = <any>action.payload.doc.data();
            const createdAt = data.createdAt.toDate();
            return { ...data, createdAt };
          })
        )
      );
  }

  /* If myContent doc exists for this article and team, flip the disabled
  flag, else create myContent for this article/team. */
  public favorite(article: Article, teamId: string): void {
    article.favorited = article.favorited ? false : true;
    let myContent = this.myContent.find(mc => mc.articleId == article.id);
    if (myContent) {
      myContent.disabled = myContent.disabled ? false : true;
      article.myContent = myContent;
      this.updateMyContent(myContent).catch(() => {
        article.favorited = !article.favorited;
        myContent.disabled = !myContent.disabled;
      });
    } else {
      /* Create myContent doc for this article, because one doesn't
      exist. Because it does not exist there has never been training
      on the article. No need to check for the last trained date per
      trainee. If myContent is "Removed" we really just set the 
      disabled boolean to true, it is never really deleted. */
      this.createMyContent(teamId, article)
        .then(myContent => (article.myContent = myContent))
        .catch(() => (article.favorited = !article.favorited));
    }
  }

  /* Called from local favorite() and after modifying trainees on the 
  article component. */
  public updateMyContent(myContent: MyContent): Promise<any> {
    let mc = { ...myContent };
    /* These keys were added on get for convenience, don't persist */
    delete mc.id;
    delete mc.needsTraining;
    return this.db
      .collection("my-content")
      .doc(myContent.id)
      .update({ ...mc })
      .catch(error => {
        console.error(
          `An error occured updating my-content collection with myContent`,
          myContent,
          error
        );
        alert("An error occured while updating myContent");
        throw error;
      });
  }

  /* If this article has never been favorited we create a myContent doc */
  private createMyContent(teamId, article: Article): Promise<MyContent> {
    const trainees = {};
    this.accountService.teamUsers.forEach(user => {
      trainees[user.uid] = null;
    });
    const myContent = new MyContent(
      article.id,
      trainees,
      teamId,
      article.name,
      article.nameEs
    );
    const id = teamId + "_" + article.id;
    return this.db
      .collection("my-content")
      .doc(id)
      .set({ ...myContent })
      .then(() => {
        const needsTraining = Object.keys(myContent.trainees);
        const complianceLevel = 0;
        const mc = { ...myContent, needsTraining, complianceLevel, id };
        this.myContent.push(mc);
        return mc;
      })
      .catch(error => {
        console.error(
          `Error writing to my-content collection`,
          myContent,
          error
        );
        alert(`Error writing to my-content collection.`);
        throw error;
      });
  }
}

export class Industry {
  name: string;
  nameEs: string;
  id?: string;
}

export class Topic {
  imageUrl: string;
  industryIds: string[];
  isGlobal: boolean;
  name: string;
  nameEs: string;
  teamId: string;
  id?: string;
}

export class Article {
  content: string;
  contentEs: string;
  isGlobal: boolean;
  name: string;
  nameEs: string;
  topicIds: string[];
  teamId: string;
  /* word count / 6 */
  trainingLevel: number;
  id?: string;
  myContent?: MyContent;
  favorited?: boolean;
}

export class MyContent {
  constructor(
    public articleId: string,
    public trainees: object,
    public teamId: string,
    public articleName: string,
    public articleNameEs: string = null
  ) {}
  trainingExpiration: TrainingExpiration = TrainingExpiration.Anually;
  lastTrainingDate: Date;
  disabled: boolean = false;
  id?: string;
  needsTraining?: string[];
  complianceLevel?: number;
}

export enum TrainingExpiration {
  Anually = "Anually",
  SemiAnually = "Semi-Anually",
  Quarterly = "Quarterly",
  Montly = "Monthly"
}

//   rememberThis() {
//       const col = this.db.collection('testcol');
//       const ids = ['a', 'b'];
//       const queries = ids.map(el => col.doc(el).valueChanges());
//       const combo = combineLatest(...queries).subscribe();
//   }
