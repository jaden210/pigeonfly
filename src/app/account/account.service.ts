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
    },
    who: {
      name: "Who's Working",
      description: "This page is a real time view of who’s working. Once members of your team have joined, you’ll see who’s clocked in, who’s clocked out, and their location."
    },
    time: {
      name: "Time",
      description: "This page is a digital time card which includes location. When members of your team clock in and out using the Minute app, those events are stored and calculated here. Click “Run Payroll” to run a payroll report. When your entire team uses the Minute app to securely clock in and out, you’ll save time and reduce the complexity of collecting payroll data each pay period. Location is logged with every clock in and clock out for future reference, or in the event of an OSHA audit or litigation."
    },
    log: {
      name: "Log",
      description: "Using the Minute app, any member of your team can create a worksite log, to include pictures and text. Location is also captured each time a log is created. Worksite logs can and should include everything from periodic progress and work accomplished, to client change orders and project updates, to incidents or other noteworthy happenings. Worksite logs form the critical historical record which is called upon in the event of an OSHA audit, or client dispute or litigation. Aside from that non-fun stuff, worksite logs create a living journal of the work you accomplish over time, which is pretty neat."
    },
    survey: {
      name: "Surveys",
      description: "Surveys deliver the critical insights you need to protect and grow your business, and make adjustments along the way to keep improving. Surveys are simple: you ask your team anything, and they are prompted to respond upon clocking out for the day on the day you set the survey to run. “Did you receive ladder safety training?”, “Did you receive sexual harassment training?”, “Did you receive PPE training?”, “Is any of your personal equipment faulty or in need of repair or replacement?”, etc. Anything you can think to ask, you can ask. Team members answer with a yes or no, and have an open text field to expound on any answer. Every question and answer is recorded so you have a unique history of training received, not as relayed by your team lead or supervisor, but as responded to _by the employees themselves_. Minute Surveys are perhaps the most powerful tool to protect and improve your business."
    },
    osha: {
      name: "OSHA Self-Inspection",
      description: "Minute simplifies self-inspection and enables you to confidently check this incredibly important compliance box. Use the self-inspection wizard to customize OSHA’s list of questions to fit your workspace. Then, take and retake the assessment periodically. Each time you do, a report will be saved in this page where you can refer to it to make improvements, or simply to prove a historical record of performing self-inspections per OSHA’s recommendation. OSHA means business. Self-inspection is key to keeping your workforce safe and your business protected."
    },
    account: {
      name: "Your Account",
      description: "For the sake of your team, please complete all available information on this page."
    },
    team: {
      name: "Your Account",
      description: "For the sake of your team, please complete all available information on this page."
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