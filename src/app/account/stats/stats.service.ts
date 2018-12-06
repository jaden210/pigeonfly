import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { AngularFireStorage } from "@angular/fire/storage";
import { AccountService } from "../account.service";

@Injectable({
  providedIn: "root"
})
export class StatsService {

  makeBlog: boolean = false;
  blog;

  constructor(
    public db: AngularFirestore,
    public storage: AngularFireStorage,
    public accountService: AccountService,
    public router: Router
  ) {}


  
}

