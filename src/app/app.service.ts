import { Injectable } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  isUser: boolean = false; // decides if a user has logged in before

  constructor(
    public db: AngularFirestore
  ) { }
}

export class User { // also in account service
  id?: string;
  uid: string;
  name?: string;
  email: string;
  profileUrl?: string;
  username?: string;
  phone?: string;
  accountType?: string;
  teams?: any[]; 
}