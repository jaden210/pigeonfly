import { Injectable, Component } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { map, take, debounceTime } from "rxjs/operators";
import { MatDialog, MatDialogRef } from "@angular/material";
import { AngularFireAuth } from "@angular/fire/auth";
import { Router } from "@angular/router";
import { AngularFireStorage } from "@angular/fire/storage";

@Injectable({
  providedIn: "root"
})
export class AccountService {
  userObservable: BehaviorSubject<any> = new BehaviorSubject(null);
  user: User = new User();
  aTeamObservable: BehaviorSubject<any> = new BehaviorSubject(null);
  aTeam: Team = new Team();
  teamUsers: User[];
  userTeams: Team[]; // all the teams the user has access to
  teamUsersObservable: BehaviorSubject<any> = new BehaviorSubject(null);
  showHelper: boolean = false;
  showFeedback: boolean = false;
  bShowProfile: boolean = false; // template var
  searchForHelper: string; // template var to assist event system;

  helperProfiles = {
    newTeam: {
      name: "welcome to Compliance Chimp!",
      description:
        "Before you can get started, you need to make a profile and create your company. All changes are saved as you make them, so feel free to leave and come back at will."
    },
    feedback: {
      name: "How can we do better?",
      description: ""
    },
    who: {
      name: "Who's Working",
      description:
        "This page is a real time view of who’s working. Once members of your team have joined, you’ll see who’s clocked in, who’s clocked out, and their location."
    },
    time: {
      name: "Time",
      description:
        "Using the app, anyone on your team can track their time. Each time event is recorded here so that you have a historical record. Time can be exported at any time, for anyone, which makes entering payroll a breeze. The administrator of this account can adjust time as necessary by clicking on any time log and editing it. Forget paperwork and workers trying to rely on memory. Use the time clock instead."
    },
    log: {
      name: "Log",
      description:
        "Using the app, any member of your team can create a worksite log, including pictures and text. Location is also captured each time a log is created. Worksite logs can and should include everything from periodic progress and work accomplished, to client change orders and project updates, to incidents, injuries, near misses, safety concerns, or other noteworthy happenings. Worksite logs build the historical record which is called upon in the event of an OSHA audit or inspection. Aside from that, worksite logs create a living journal of the work your business accomplishes over time, all in one central place."
    },
    event: {
      name: "Events",
      description:
        "Every time any member of your team uses the Compliancechimp app for anything (worksite log, training, training surveys, time clock, injury report, etc), the “event” gets recorded here in the Events page. Think of this as a flowing stream of consciousness of your team’s activity. Why does this page exist? The answer is simple: proof of compliance.  One of the most difficult parts of compliance is paperwork, or evidence of compliance. We take the hassle completely out of it. When your team uses the Compliancechimp app to its potential, the Events page gives you a very simple, clean, consolidated, and searchable record of activity that goes back as far as the day you signed up. It’s the critical backstop in the event of an audit, and can provide additional insights to your business along the way."
    },
    survey: {
      name: "Surveys",
      description:
        "Welcome to a surprisingly insightful and meaningful part of Compliancechimp; worker surveys. How do provide safety training to your team, and how do you track those trainings? How do you know if someone feels safe? How do you know that everyone has the safety equipment they need, and that you are required to provide? Sure, you could create paperwork to check these boxes. But we’ve made this much easier, much more reliable, and much more meaningful.  Every time a training is given, a survey automatically goes out to each member of the team that participated. They can answer yes or no to whether or not they received the training, and add any further comments. Now, you don’t simply have a supervisor’s report. You have a first-person worker response to training, which is very easy for them to do, happens every time, and is stored forever.  These surveys go even further. You can create a  custom survey at any time and send it to any person, group, or the entire team. Find out first-person if your workers have performed the inspections they are responsible for, if they have the personal protective equipment they need, and anything else you can think of. The power of the survey is that it is always first-person, and it is tracked and stored forever."
    },
    incidentReport: {
      name: "Incident Reports",
      description:
        "Compliancechimp puts injury and near miss reporting, along with the accompanying investigation, right in the hands of every worker. From the Account section of the app, anyone can report an injury or near miss, including pictures and signature. Those reports flow here, where they are stored safely, forever. This is massively important in the event of an inspection or audit. These reports create what is known as the 300 Log."
    },
    selfInspection: {
      name: "Self-Inspection",
      description:
        "The most important preventive measure any business takes to protect its workers, is ensuring the workplace itself is safe. No amount of training can compensate for an unsafe work environment. Our self-inspection process helps you identify risks, and address them. Click the plus button to the right to begin your first self inspection. And you can create as many self-inspections as you’d like - covering any number of different locations or worksites, etc."
    },
    osha: {
      name: "OSHA Self-Inspection",
      description:
        "We simplify self-inspection and enables you to confidently check this incredibly important compliance box. Use the self-inspection wizard to customize OSHA’s list of questions to fit your workspace. Then, take and retake the assessment periodically. Each time you do, a report will be saved in this page where you can refer to it to make improvements, or simply to prove a historical record of performing self-inspections per OSHA’s recommendation. OSHA means business. Self-inspection is key to keeping your workforce safe and your business protected."
    },
    account: {
      name: "Your Account",
      description:
        "Please ensure all information is filled out in your Account, even down to your company logo and profile picture. Your account holds personal details, business details, and billing and payment details."
    },
    team: {
      name: "Team",
      description:
        "Invite everyone on your team by clicking the orange “+” button to the right. Each person you invite will receive an email with instructions to download the app and join your team. Once joined, you’ll see all of their activity including training surveys, worksite logs, injury reports, and time if you choose to have your team track their time using the app (it’s really easy). Invite your entire team today!"
    },
    companyType: {
      name: "Company Type",
      description:
        "Selecting a company type will help us show the right infomation to your users in the app. put better stuff here."
    },
    achievement: {
      name: "Achievements",
      description:
        "This page was designed specifically to help you gain the benefits of Compliancechimp as quickly as possible. Compliancechimp is a thorough and powerful platform which improves safety and protects businesses. But those benefits only come if it gets used. Get started on earning every trophy, today. Your compliance coincides with earning these trophies. When you’ve earned them all, we’ll send along some fun Compliancechimp merch as a reward."
    },
    training: {
      name: "Training",
      description:
        "The difference between each of your workers making it home safe tonight, or not, could be the next safety training. And the difference between passing an OSHA audit or not, is proof that the training occurred.  We’ve curated and organized OSHA safety content as the most fundamental starting point. Your opportunity is to go through the available training topics and select the ones that are relevant to your operation. When you heart a topic, it will become available to each of your workers via the app. Each training shows the estimated time to accomplish, but remember this is only an estimate. Training can go longer or shorter based on your specific needs.  And training doesn’t stop with OSHA content. We’ve opened the training platform up for you to add your own training materials as well. Use this training page to build topics and articles and make them available to your entire team. From a compliance perspective, giving safety training is key to keeping workers safe. But proving you’ve given training is the key to protecting your business in an OSHA audit. By training here, you lock down an authoritative record of what training was given, when, and to who. And it’s stored forever in one consolidated, simple place.  Compliancechimp’s training platform is powerful, and we encourage you to take full advantage of it."
    }
  };
  helper: Helper = this.helperProfiles.newTeam;
  feedback: Helper = this.helperProfiles.feedback;

  constructor(
    public db: AngularFirestore,
    private auth: AngularFireAuth,
    public storage: AngularFireStorage,
    public dialog: MatDialog,
    public router: Router
  ) {}

  setActiveTeam(teamId) {
    localStorage.setItem("teamId", teamId); // so we only ask once.
    let teamDoc = this.db.collection<Team>("team").doc(teamId);
    teamDoc
      .snapshotChanges()
      .pipe(
        map((actions: any) => {
          let data = actions.payload.data();
          data["id"] = actions.payload.id;
          data["createdAt"] = data.createdAt.toDate();
          return data;
        })
      )
      .subscribe(team => {
        if (this.user.teams[team.id] == 0) {
          // they cant be here. TODO: Check this before getting the team data
          let dialog = this.dialog.open(NoAccessDialog, {
            disableClose: true
          });
          dialog.afterClosed().subscribe(() => this.logout());
        } else {
          this.aTeam = team;
          this.aTeamObservable.next(team);
          this.db
            .collection("user", ref => ref.where(`teams.${team.id}`, ">=", 0))
            .snapshotChanges()
            .pipe(
              debounceTime(250), // IDK FIX
              map(actions =>
                actions.map(a => {
                  console.log("hithit");
                  //better way
                  const data = a.payload.doc.data() as User;
                  const id = a.payload.doc.id;
                  return { id, ...data };
                })
              )
            )
            .subscribe(users => {
              // why is this being hit twice???????
              this.teamUsers = users;
              this.teamUsersObservable.next(users);
            });
        }
      });
  }

  logout() {
    this.auth.auth.signOut().then(() => this.router.navigate(["/login"]));
  }
}

@Component({
  selector: "no-access-dialog",
  templateUrl: "no-access-dialog.html",
  styleUrls: ["./account.component.css"]
})
export class NoAccessDialog {
  constructor(public dialogRef: MatDialogRef<NoAccessDialog>) {}

  close(): void {
    this.dialogRef.close();
  }
}

export class User {
  id?: string;
  uid: string;
  name?: string;
  email: string;
  jobTitle?: string;
  profileUrl?: string;
  username?: string;
  phone?: string;
  accountType?: string;
  teams?: any[];
  isDev: boolean = false;
}

export class Team {
  id: string;
  name: string;
  createdAt: Date;
  ownerId: string;
  logoUrl?: string;
  phone?: string;
  industryId?: string;
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
  updatedId: string;
  updatedBy: string;
  updatedAt: Date;
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
  updatedId: string;
  updatedBy: string;
  updatedAt: Date;
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
  status: string = "invited";
  isAdmin: boolean = false;
}

export class Event {
  id?: string;
  type: string; // survey, survey response, timeclock, log, injury report, supervisor report, self assesment
  documentId: string;
  userId: string;
  title: string;
  createdAt: any;
  teamId: string;
}
