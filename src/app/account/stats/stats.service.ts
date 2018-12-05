import { Injectable } from "@angular/core";
import { of, Observable, combineLatest, merge } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { AngularFireStorage } from "@angular/fire/storage";
import { map, catchError, tap, take, mergeMap } from "rxjs/operators";
import { AccountService } from "../account.service";
import { Survey } from "../surveys/survey/survey";

@Injectable({
  providedIn: "root"
})
export class StatsService {

  makeBlog: boolean = false;
  

  constructor(
    public db: AngularFirestore,
    public storage: AngularFireStorage,
    public accountService: AccountService,
    public router: Router
  ) {}


  
}

