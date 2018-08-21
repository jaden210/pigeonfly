import { Component, OnInit } from '@angular/core';
import { trigger, style, transition, animate } from "@angular/animations";
import { AccountService, User, Team } from './account.service';
import { AngularFireAuth } from 'angularfire2/auth';
import { map } from "rxjs/operators";
import { Router } from '@angular/router';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
  animations: [
    trigger("helper", [
      transition(":enter", [
        style({ transform: "translateX(-150%)", opacity: 0 }),
        animate("400ms ease-out", style({ transform: "translateX(0)", opacity: 1 }))
      ]),
      transition(":leave", [
        style({ transform: "translateX(0)", opacity: 1 }),
        animate("400ms ease-in", style({ transform: "translateX(-150%)", opacity: 0 }))
      ])
    ])
  ]
})
export class AccountComponent implements OnInit {

  constructor(
    public accountService: AccountService,
    private auth: AngularFireAuth,
    public router: Router
  ) { 
    this.auth.auth.onAuthStateChanged(user => {
      if (user.uid) {
        let userDoc = this.accountService.db.collection("user").doc(user.uid)
        userDoc.snapshotChanges().pipe(
          map((actions:any) => {
            let data = actions.payload.data();
            data['id'] = actions.payload.id;
            return data;
          })
        ).subscribe((user: User) => {
          this.accountService.userObservable.next(user);
          this.accountService.user = user;
          // there is a potential bug here if a user tries to become a customer. needs some additional thought.
          if (Object.keys(user.teams).length == 0) { // create a team
            let newTeam = new Team();
            newTeam.createdAt = new Date();
            newTeam.ownerId = user.id;
            this.accountService.db.collection("team").add({...newTeam}).then(() => {
              this.accountService.helper = this.accountService.helperProfiles.newTeam;
              this.accountService.showHelper = true;
              this.router.navigate(['team']);
            });
          } else { // get team and team members
            let teamDoc = this.accountService.db.collection<Team>("team").doc(Object.keys(this.accountService.user.teams)[0]);
            teamDoc.snapshotChanges().pipe(
              map((actions:any) => {
                let data = actions.payload.data();
                data['id'] = actions.payload.id;
                return data;
              })
            ).subscribe(team => {
              this.accountService.aTeam = team;
              this.accountService.aTeamObservable.next(team);
              let membersCollection = this.accountService.db.collection<User>("user", ref => ref.where("teams." + team.id, ">=", 0));
              membersCollection.snapshotChanges().pipe(
                map(actions => actions.map(a => { //better way
                  const data = a.payload.doc.data() as User;
                  const id = a.payload.doc.id;
                  return { id, ...data };
                }))
              ).subscribe(users => {
                this.accountService.teamUsers = users;
                this.accountService.teamUsersObservable.next(users);
              })
            });
           
          }
        });
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnInit() {
  }

  closeHelper() {
    this.accountService.showHelper = false;
  }

  submit() {
    this.accountService.feedback.name = "Thanks for your feedback!"
    setTimeout(() => {
      this.accountService.showFeedback = false;
      this.accountService.db.collection("feedback").add({
        origin: 'feeback helper',
        originPage: window.location.pathname,
        description: this.accountService.feedback.description,
        userId: this.accountService.user.id,
        userName: this.accountService.user.name,
        teamName: this.accountService.aTeam.name,
        createdAt: new Date()
      }).then(() => {
        this.accountService.feedback = this.accountService.helperProfiles.feedback;
      });
    }, 2000);
  }
}
