import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AccountService } from '../account.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.css']
})
export class AchievementsComponent implements OnInit {

  achievements;
  completedCount: number;
  orderings = [{ordering: 0, achievements: [], completed: 0, completedPercent: ""}];

  @ViewChild("myCanvas")
  canvas: ElementRef;
  context;

  progress = 0;

  constructor(public accountService: AccountService) { }

  ngOnInit() {
    this.accountService.helper = this.accountService.helperProfiles.achievement;
    this.accountService.teamUsersObservable.subscribe(users => {
      if (users) {
        let achievementsCollection = this.accountService.db.collection("achievement", ref => ref.orderBy("ordering"));
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
                  let order = this.orderings.find(order => order.ordering == achievement.ordering);
                  if (!order) {
                    order = {ordering: achievement.ordering, achievements: [], completed: 0, completedPercent: ""};
                    order.achievements.push(achievement);
                    this.orderings.push(order);
                  } else {
                    order.achievements.push(achievement);
                  }
                });
                this.orderings.forEach(ordering => {
                  ordering.achievements.forEach(oachievement => {
                    oachievement.progress = completedAchievement[0][oachievement.key];
                    if (oachievement.progress >= oachievement.completedValue || oachievement.progress == true) { //already achieved
                      oachievement.complete = true;
                      this.completedCount ++;
                      oachievement.fill = '100%';
                      ordering.completed = ordering.completed + 100;
                    } else {
                      if (oachievement.progress !== false) {
                        oachievement.fill = ((oachievement.progress / oachievement.completedValue) * 100).toString() + "%";
                        ordering.completed = ordering.completed + ((oachievement.progress / oachievement.completedValue) * 100);
                      }
                    }
                  });
                  ordering.completed = ordering.completed / ordering.achievements.length;
                  ordering.completedPercent = ordering.completed + "%";
                  console.log(ordering.completed);
                  console.log(ordering.completedPercent);
                  
                })
              })
            
          });
      }
    });
  }  

  counter(i: number) {
    return new Array(i);
}


}


export class Achievements {
  id?: string;
  category: string;
  name: string;
  completedValue: number;
  key: string
  ordering: number;

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