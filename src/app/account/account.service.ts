import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AngularFirestore } from 'angularfire2/firestore';

@Injectable({
  providedIn: 'root'
})
export class AccountService {


  userObservable: BehaviorSubject<any> = new BehaviorSubject(null);
  user: User = new User();
  aTeamObservable: BehaviorSubject<any> = new BehaviorSubject(null);
  aTeam: Team = new Team();
  teamUsers: User[];
  teamUsersObservable: BehaviorSubject<any> = new BehaviorSubject(null);
  showHelper: boolean = false;
  showFeedback: boolean = false;
  helperProfiles = {
    newTeam: {
      name: "welcome to minute!",
      description: "Before you can get started, you need to make a profile and create your company. All changes are saved as you make them, so feel free to leave and come back at will.",
    },
    feedback: {
      name: "How can we do better?",
      description: '',
    }
  }
  helper: Helper = this.helperProfiles.newTeam;
  feedback: Helper = this.helperProfiles.feedback;

  constructor(
    public db: AngularFirestore
  ) { }
}

export class User {
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

export class Team {
  id: string;
  name: string;
  createdAt: Date;
  ownerId: string;
  logoUrl?: string;
  phone?: string;
}

export class Log {
  id: string;
  createdAt: Date;
  teamId: string;
  userId: string;
  description: string;
  images: any[];
  surveySubject?: string;
  surveyQuestion?: string;
  LatPos: number;
  LongPos: number;
}

export class Survey {
  id: string;
  teamId: string;
  createdAt: Date;
  title: string;
  category: string;
  active: boolean;
  runType: string;
  types: any =  {
    daily: true,
    dow: [],
    dom: [],
    date: new Date()
  }
}

export class Timeclock {
  id?: string;
  userId: string;
  teamId: string;
  clockIn: any;
  clockOut?: any;
  time?: string;
  overriddenBy?: string;
  loggedHours?: number;
  loggedMinutes?: number;
  inLatPos?: any;
  inLongPos?: any;
  outLatPos?: any;
  outLongPos?: any;
}

export class Helper {
  name: string;
  description: string;
}

export class InviteToTeam {
  inviteName: string;
  inviteEmail: string;
  companyName: string;
  teamId: string;
  status: string = 'invited';
}