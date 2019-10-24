import { Component, OnInit } from '@angular/core';
import { AccountService, Gym } from '../account.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppService } from 'src/app/app.service';

@Component({
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.css']
})
export class PrintComponent implements OnInit {
  private subscription: Subscription;
  private gymSubscription: Subscription;

  public gym: Gym = new Gym;

  constructor(
    private appService: AppService,
    public accountService: AccountService,
    private router: Router
  ) { }


  ngOnInit() {
    this.subscription = this.accountService.userObservable.subscribe(user => {
      if (user) {
        if (this.accountService.user.gymId) {
          this.gymSubscription = this.accountService.gymObservable.subscribe(gym => {
            if (gym) {
              this.gym = gym;
              setTimeout(() => {
                window.print();
              }, 1000); 
            }
          })
        } else this.router.navigate(['/account/account']);
      }
    })
  }

  
}