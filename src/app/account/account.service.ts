import { Injectable, Component } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AngularFirestore } from "angularfire2/firestore";
import { map } from "rxjs/operators";
import { MatDialog, MatDialogRef } from "@angular/material";
import { AngularFireAuth } from "angularfire2/auth";
import { Router } from "@angular/router";
import { AngularFireStorage } from "angularfire2/storage";

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
        "This page is a digital time card which includes location. When members of your team clock in and out using the Minute app, those events are stored and calculated here. Click “Run Payroll” to run a payroll report. When your entire team uses the Minute app to securely clock in and out, you’ll save time and reduce the complexity of collecting payroll data each pay period. Location is logged with every clock in and clock out for future reference, or in the event of an OSHA audit or litigation."
    },
    log: {
      name: "Log",
      description:
        "Using the app, any member of your team can create a worksite log, to include pictures and text. Location is also captured each time a log is created. Worksite logs can and should include everything from periodic progress and work accomplished, to client change orders and project updates, to incidents or other noteworthy happenings. Worksite logs form the critical historical record which is called upon in the event of an OSHA audit, or client dispute or litigation. Aside from that non-fun stuff, worksite logs create a living journal of the work you accomplish over time, which is pretty neat."
    },
    survey: {
      name: "Surveys",
      description:
        "Surveys deliver the critical insights you need to protect and grow your business, and make adjustments along the way to keep improving. Surveys are simple: you ask your team anything, and they are prompted to respond upon clocking out for the day on the day you set the survey to run. “Did you receive ladder safety training?”, “Did you receive sexual harassment training?”, “Did you receive PPE training?”, “Is any of your personal equipment faulty or in need of repair or replacement?”, etc. Anything you can think to ask, you can ask. Team members answer with a yes or no, and have an open text field to expound on any answer. Every question and answer is recorded so you have a unique history of training received, not as relayed by your team lead or supervisor, but as responded to _by the employees themselves_. Minute Surveys are perhaps the most powerful tool to protect and improve your business."
    },
    osha: {
      name: "OSHA Self-Inspection",
      description:
        "We simplify self-inspection and enables you to confidently check this incredibly important compliance box. Use the self-inspection wizard to customize OSHA’s list of questions to fit your workspace. Then, take and retake the assessment periodically. Each time you do, a report will be saved in this page where you can refer to it to make improvements, or simply to prove a historical record of performing self-inspections per OSHA’s recommendation. OSHA means business. Self-inspection is key to keeping your workforce safe and your business protected."
    },
    account: {
      name: "Your Account",
      description:
        "For the sake of your team, please complete all available information on this page."
    },
    team: {
      name: "Team",
      description:
        "On this page you’ll build your team by entering names and email addresses, and sending invitations. Invite as many members as you’d like. Once a member accepts the invitation, they’ll download the Minute app onto their phone and show up here. A green dot indicates someone who is currently clocked in. An orange dot indicates someone who has been clocked in today, but is not currently clocked in. A gray dot is someone who has not clocked in at any point today. Location is also recorded with each clock in or out and can be accessed by clicking on the map pin. Return to this page often to see who’s actively on the clock, and to invite more members to join."
    },
    companyType: {
      name: "Company Type",
      description:
        "Selecting a company type will help us show the right infomation to your users in the app. put better stuff here."
    },
    welcome: {
      name: "Welcome",
      description:
        "Compliancechimp is simple, but seriously powerful. When fully embraced, it will change the safety and compliance risk profile of your business. This Welcome section is always available in the menu, and is designed to guide you through every feature so you can get fully up to speed."
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
          let membersCollection = this.db.collection<User>("user", ref =>
            ref.where("teams." + team.id, ">=", 0)
          );
          membersCollection
            .snapshotChanges()
            .pipe(
              map(actions =>
                actions.map(a => {
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

  createEvent(type, documentId, userId, title, teamId) {
    //this method also exists in minute project, if changes are made here make them there as well
    let nd = new Date();
    this.db
      .collection("event")
      .add({ type, documentId, userId, title, createdAt: nd, teamId })
      .then(() => {})
      .catch(error => {
        console.log("error creating event");
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
