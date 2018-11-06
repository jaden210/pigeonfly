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
  completedCount: number;

  constructor(public accountService: AccountService) { }

  ngOnInit() {
    this.accountService.teamUsersObservable.subscribe(users => {
      if (users) {
        let achievementsCollection = this.accountService.db.collection("achievement", ref => ref.orderBy("category"));
        achievementsCollection.snapshotChanges().pipe(
          map(actions => actions.map(a => { //better way
            const data = a.payload.doc.data() as Achievements;
            const id = a.payload.doc.id;
            return { id, ...data };
          }))
          ).subscribe(achievements => {
            this.achievements = achievements;
            let completedCollection = this.accountService.db.collection("completed-achievement", ref => ref.where("teamId", "==", this.accountService.aTeam.id));
            completedCollection.snapshotChanges().pipe(
              map(actions => actions.map(a => { //better way
                const data = a.payload.doc.data() as CompletedAchievements;
                const id = a.payload.doc.id;
                return { id, ...data };
              }))
              ).subscribe(completedAchievement => {
                this.completedCount = 0;
                achievements.forEach(achievement => {
                  achievement.progress = completedAchievement[0][achievement.key];
                  if (achievement.progress >= achievement.completedValue) { //already achieved
                    achievement.complete = true;
                    this.completedCount ++;
                    achievement.fill = '100%';
                  } else {
                    achievement.fill = ((achievement.progress / achievement.completedValue) * 100).toString() + "%";
                  }
                });
              })
            
          });
      }
    });
  }

}


export class Achievements {
  id?: string;
  category: string;
  name: string;
  completedValue: number;
  key: string

  complete: boolean;
  progress?: any;
  fill;
}

export class CompletedAchievements {
  id?: string;
  teamId: string;
  achievementId: string;
  createdAt: Date;
}