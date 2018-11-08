import { Component, OnInit , Inject} from '@angular/core';
import { AccountService } from '../account.service';
import { map } from 'rxjs/operators';
import { User } from '../../app.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {

  supportItems: Support[];
  feedbackItems: Observable<any>;
  aItem: Support; // temp var

  constructor(public accountService: AccountService) { }

  ngOnInit() {
    this.accountService.teamUsersObservable.subscribe(users => {
      if (users) {
        let supportCollection = this.accountService.db.collection("support", ref => ref.orderBy("createdAt"));
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
        let feedbackCollection = this.accountService.db.collection("feedback", ref => ref.orderBy("createdAt"));
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