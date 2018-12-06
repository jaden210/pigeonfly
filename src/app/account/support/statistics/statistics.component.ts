import { Component, OnInit , ViewChild} from '@angular/core';
import { map } from 'rxjs/operators';
import { User } from '../../../app.service';
import { MatSort, MatTableDataSource } from '@angular/material';
import { SupportService } from '../support.service';

@Component({
  selector: 'statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {

  @ViewChild(MatSort) sort: MatSort;
  aItem: Support; // temp var
  teams = [];
  displayedColumns: string[] = ["name","users", "logs"];
  datasource = new MatTableDataSource(this.teams)

  constructor(public supportService: SupportService) { }

  ngOnInit() {
    this.datasource.sort = this.sort;
    this.getStatsFromCompletedAchievements();
  }

  getStatsFromCompletedAchievements() {
    this.supportService.db.collection("team").valueChanges().subscribe(teams => {
      this.teams = teams;
      teams.forEach((team: any) => {
        this.supportService.db.collection("completed-achievement", ref => ref.where("teamId", "==", team.id)).valueChanges().subscribe(achievements => {
          team.achievements = achievements[0];
        });
        this.supportService.db.collection("user", ref => ref.where(`teams.${team.id}`, ">=", 0))
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