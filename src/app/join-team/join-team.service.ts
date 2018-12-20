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
export class JoinTeamService {
  constructor(
    private appService: AppService,
    private db: AngularFirestore,
    private auth: AngularFireAuth
  ) {}

  get Email(): string {
    return this.appService.email;
  }

  createAuthUser(password, email): Promise<firebase.auth.UserCredential> {
    return this.auth.auth.createUserWithEmailAndPassword(email, password);
  }

  createUser(
    user: firebase.auth.UserCredential,
    teamId,
    isAdmin,
    name
  ): Promise<any> {
    let newUser = new User();
    newUser.id = user.user.uid;
    newUser.email = user.user.email;
    newUser.profileUrl = user.user.photoURL || null;
    newUser.name = name;
    newUser.teams[teamId] = isAdmin ? 1 : 0;
    return this.db
      .collection("user")
      .doc(newUser.id)
      .set({ ...newUser })
      .then(() => newUser);
  }

  removeFromInvitaionCollection(id): Promise<void> {
    return this.db
      .collection("invitation")
      .doc(id)
      .delete();
  }
}
