import { Component, OnInit } from '@angular/core';
import { AccountService } from '../account.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {

  achievements;
  completedAchievements;

  constructor(public accountService: AccountService) { }

  ngOnInit() {
    this.accountService.teamUsersObservable.subscribe(users => {
      if (users) {
        let achievementsCollection = this.accountService.db.collection("achievement");
        achievementsCollection.snapshotChanges().pipe(
          map(actions => actions.map(a => { //better way
            const data = a.payload.doc.data() as Achievements;
            const id = a.payload.doc.id;
            return { id, ...data };
          }))
          ).subscribe(achievements => {
            this.achievements = achievements;
            let completedCollection = this.accountService.db.collection("completed-achievement");
            completedCollection.snapshotChanges().pipe(
              map(actions => actions.map(a => { //better way
                const data = a.payload.doc.data() as CompletedAchievements;
                const id = a.payload.doc.id;
                const createdAt = data['createdAt'];
                return { id, createdAt, ...data };
              }))
              ).subscribe(completedAchievements => {
                this.completedAchievements = completedAchievements;
                achievements.forEach(achievement => {
                  if (completedAchievements.find(ca => ca.achievementId == achievement.id)) { //already acheived
                    achievement.complete = true;
                  } else { // see if achieved yet...

                  }; // end
                });
              })
            
          });
      }
    })
  }

}


export class Achievements {
  id?: string;
  category: string;
  name: string;
  completedValue: number;

  complete: boolean;
  progress: any;
}

export class CompletedAchievements {
  id?: string;
  teamId: string;
  achievementId: string;
  createdAt: Date;
}