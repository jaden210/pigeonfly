import { Component, OnInit , ViewChild} from '@angular/core';
import { AccountService, Team } from '../account.service';
import { map } from 'rxjs/operators';
import { User } from '../../app.service';
import { Observable } from 'rxjs';
import { MatSort, MatTableDataSource } from '@angular/material';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {

  @ViewChild(MatSort) sort: MatSort;
  supportItems: Support[];
  feedbackItems: Observable<any>;
  aItem: Support; // temp var
  teams = [];
  displayedColumns: string[] = ["name","users", "logs"];
  datasource = new MatTableDataSource(this.teams)

  constructor(public accountService: AccountService) { }

  ngOnInit() {
    this.datasource.sort = this.sort;
    this.accountService.teamUsersObservable.subscribe(users => {
      if (users) {
        this.getStatsFromCompletedAchievements();
        let supportCollection = this.accountService.db.collection("support", ref => ref.orderBy("createdAt", "desc"));
        supportCollection.snapshotChanges().pipe(
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
        ).subscribe((supportItems: any) => {
          this.supportItems = supportItems;
          supportItems.forEach(item => {
            let user = users.find(user => user.email == supportItems.email);
            if (user) {
              supportItems.isUser = true;
              supportItems.user = user
            }
          });
        });
        let feedbackCollection = this.accountService.db.collection("feedback", ref => ref.orderBy("createdAt", "desc"));
        this.feedbackItems = feedbackCollection.snapshotChanges().pipe(
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
    });
  }

  getStatsFromCompletedAchievements() {
    this.accountService.db.collection("team").valueChanges().subscribe(teams => {
      this.teams = teams;
      teams.forEach((team: any) => {
        this.accountService.db.collection("completed-achievement", ref => ref.where("teamId", "==", team.id)).valueChanges().subscribe(achievements => {
          team.achievements = achievements[0];
        });
        this.accountService.db.collection("user", ref => ref.where(`teams.${team.id}`, ">=", 0))
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
          team.users = users;
        });
      })
    });
  }

  expandItem(item) {
    this.aItem = item;
    this.accountService.db.collection<User[]>("user", ref => ref.where("email", "==", item.email)).valueChanges().subscribe(users => {
      users.forEach((user: any) => { // can only be one
        this.aItem.isUser = true;
        this.aItem.user = user;
        console.log(user);
        
      });
    });
  }

  markReplied() {
    this.accountService.db.doc("support/" + this.aItem.id).update({respondedAt: new Date()}).then(() => {
      this.aItem = null;
    });
  }
  
  close(item) {
    this.accountService.db.doc("feedback/" + item.id).update({isClosed: true}).then(() => {
    });
  }

  email(item) {
    var subject = "Compliancechimp Feedback Team";
    var emailBody =
      "After looking into your feedback.....";
    window.open("mailto:" + item.email + "?subject=" + subject + "&body=" + emailBody, "_blank");
  }

  getUserInfo() {

  }
}

export class Support {
  id?: string;
  createdAt: any;
  email: string;
  body: string;
  isUser?: boolean = false;
  user?: User;

  respondedAt?: any;
  notes?: string;
}