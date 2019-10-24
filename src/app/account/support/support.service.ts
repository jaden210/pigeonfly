import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { AngularFireStorage } from "@angular/fire/storage";
import { AccountService, User, Gym } from "../account.service";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";

@Injectable()
export class SupportService {

  makeBlog: boolean = false;
  blog;
  makeGym: boolean = false;
  gym: Gym = new Gym();

  constructor(
    public db: AngularFirestore,
    public storage: AngularFireStorage,
    public accountService: AccountService,
    public router: Router
  ) {}

  getSupportItems(): Observable<Support[]> {
    let supportCollection = this.db.collection("support", ref => ref.orderBy("createdAt", "desc"));
      return supportCollection.snapshotChanges().pipe(
        map(actions => {
          return actions.map(a => {
            let data = a.payload.doc.data() as Support;
            return {
              ...data,
              id: a.payload.doc.id,
              createdAt: data["createdAt"].toDate()
            };
          });
        })
      )
  }

  getSupportItemUser(email): Observable<User[]> {
    return this.db.collection<User>("user", ref => ref.where("email", "==", email)).valueChanges();
  }

  setSupportReplied(id) {
    return this.db.doc("support/" + id).update({respondedAt: new Date()});
  }

  getFeedbackItems(): Observable<any> {
    let feedbackCollection = this.db.collection("feedback", ref => ref.orderBy("createdAt", "desc"));
    return feedbackCollection.snapshotChanges().pipe(
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

  setFeedbackClosed(id): Promise<any> {
    return this.db.doc("feedback/" + id).update({isClosed: true});
  }

  getInspectionCollection(collectionName): Observable<any> {
    let collection = this.db.collection(collectionName, ref => ref.orderBy("order", "asc"));
    return collection.snapshotChanges().pipe(
      map(actions => actions.map(a => { //better way
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    )
  }

  getBlogs(): Observable<Blog[]> {
    return this.db.collection("blog").snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
          const data = a.payload.doc.data() as Blog;
          const id = a.payload.doc.id;
          data['createdAt'] = data.createdAt.toDate();
          return { id, ...data };
        })
      )
    )
  }

  getBlogTopics(): Observable<any> {
    return this.accountService.db.collection("blog-topic").snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
          const data = a.payload.doc.data() as any;
          const id = a.payload.doc.id;
          return { id, ...data };
        })
      )
    )
  }

  getGyms() {
    return this.db.collection("gyms", ref => ref.orderBy("createdAt", "desc")).snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
          //better way
          const data = a.payload.doc.data() as any;
          const id = a.payload.doc.id;
          data.createdAt = data.createdAt.toDate();
          return { id, ...data };
        })
        )
    )
  }
}

export class Support {
  id?: string;
  createdAt: any;
  email?: string;
  body: string;
  isUser?: boolean = false;
  user?: User;

  respondedAt?: any;
  notes?: string;
}


export class Blog {
  content: string;
  contentEs: string;
  name: string;
  nameEs: string;
  topicId: string;
  id?: string;
  linkName?: string;
  createdAt: any;
}