import { Injectable } from "@angular/core";
import { map, take } from "rxjs/operators";
import { forkJoin } from "rxjs";
import { AppService } from "../app.service";
import { AngularFirestore } from "@angular/fire/firestore";
import { AngularFireAuth } from "@angular/fire/auth";
import { User, Team } from "../account/account.service";
import {
  Industry,
  Topic,
  Article,
  MyContent
} from "../account/training/training.service";
declare var gtag: Function;

@Injectable()
export class GetStartedService {
  industries: Industry[];
  name: string;
  companyName: string;
  jobTitle: string;
  industryId: string;

  constructor(
    private appService: AppService,
    private db: AngularFirestore,
    private auth: AngularFireAuth
  ) {}

  get Email(): string {
    return this.appService.email;
  }

  setIndustries(): void {
    this.db
      .collection("industry")
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const id = a.payload.doc.id;
            const data = a.payload.doc.data();
            return <Industry>{ ...data, id };
          })
        )
      )
      .subscribe(industries => (this.industries = industries));
  }

  createAuthUser(password): Promise<firebase.auth.UserCredential> {
    return this.auth.auth
      .createUserWithEmailAndPassword(this.Email, password)
      .catch(error => {
        console.error(error);
        throw error;
      });
  }

  createTeam(userId): Promise<string> {
    gtag("event", "account_created", {
      event_category: "newAccount",
      event_label: `${this.name} created an account`
    });
    let newTeam = new Team();
    newTeam.createdAt = new Date();
    newTeam.ownerId = userId;
    newTeam.name = this.companyName;
    newTeam.industryId = this.industryId;
    return this.db
      .collection("team")
      .add({ ...newTeam })
      .then(team => team.id)
      .catch(error => {
        console.error(error);
        throw error;
      });
  }

  createUser(user: firebase.auth.UserCredential, teamId): Promise<any> {
    let newUser = new User();
    newUser.id = user.user.uid;
    newUser.email = user.user.email;
    newUser.profileUrl = user.user.photoURL || null;
    newUser.name = this.name;
    newUser.jobTitle = this.jobTitle || null;
    newUser.isDev = false;
    newUser.teams[teamId] = 1;
    return this.db
      .collection("user")
      .doc(newUser.id)
      .set({ ...newUser })
      .then(() => newUser)
      .catch(error => {
        console.error(error);
        throw error;
      });
  }

  createCompletedAchievement(teamId): void {
    /* TODO: make this an interface that the cloud function can access */
    this.db
      .collection("completed-achievement")
      .add({
        teamId: teamId,
        hasCompanyLogo: false,
        hasOwnerProfileUrl: false,
        hasBillingInfo: false,
        logsCount: 0,
        timeclocksCount: 0,
        invitedUsers: 0,
        likedTrainingContent: 0,
        startedTrainings: 0,
        startedSelfAssesments: 0,
        completedSelfAssesments: 0,
        injuryReports: 0,
        trainingSurveyResponseCount: 0,
        isInviteEntireTeam: null,
        customTrainingArticleCount: 0,
        isAllSelfInspections: null,
        isTeamSubmitInjuryReport: null,
        isTeamCreateLogs: null,
        isTrainingDashboardComplete: null,
        isCurrentOnSelfInspections: null,
        isCorrectedSelfInspections: null,
        isAccidentsReported: null,
        isAccidentVisible: null,
        isInvitesCurrent: null,
        hasContactInfo: null,
        isPosterDisplayed: null,
        isEquipmentProvided: null,
        isAppDownload: null,
        isSelectTrainingContent: null
      })
      .catch(error => {
        console.error(error);
        throw error;
      });
  }

  setDefaultArticles(teamId, userId): void {
    let indCol = this.db
      .collection("industry", ref => ref.where("default", "==", true))
      .snapshotChanges()
      .pipe(
        take(1),
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data() as Industry;
            const id = a.payload.doc.id;
            return { id, ...data };
          })
        )
      );
    let topCol = this.db
      .collection("topic")
      .snapshotChanges()
      .pipe(
        take(1),
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data() as Topic;
            const id = a.payload.doc.id;
            return { id, ...data };
          })
        )
      );
    forkJoin(indCol, topCol).subscribe(([industries, topics]) => {
      let filterTopics = topics.filter(
        topic =>
          topic.industryId == industries[0].id ||
          topic.industryId == this.industryId
      );
      let topicColl = [];
      filterTopics.forEach(topic => {
        topicColl.push(
          this.db
            .collection("article", ref =>
              ref
                .where("topicId", "==", topic.id)
                .where("isDefault", "==", true)
            )
            .snapshotChanges()
            .pipe(
              take(1),
              map(actions =>
                actions.map(a => {
                  const data = a.payload.doc.data() as Article;
                  const id = a.payload.doc.id;
                  return { id, ...data };
                })
              )
            )
        );
      });
      forkJoin(topicColl).subscribe(results => {
        let promises = [];
        const shouldReceiveTrainingTemplate = new Map();
        shouldReceiveTrainingTemplate[userId] = null;
        results.forEach(articleArray => {
          articleArray.forEach(article => {
            const trainingMinutes =
              Math.ceil(article.content.length / 480 / 5) * 5;
            const myContent = new MyContent(
              article.id,
              { ...shouldReceiveTrainingTemplate },
              teamId,
              article.name,
              article.nameEs,
              article.topicId,
              trainingMinutes
            );
            promises.push(
              this.db
                .collection(`team/${teamId}/my-training-content`)
                .add({ ...myContent })
            );
          });
        });
        Promise.all(promises).then(() =>
          console.log("finished defaulting articles")
        );
      });
    });
  }
}
