import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  loginErrorStr;
  email;

  constructor(public appService: AppService, private router: Router) { }

  ngOnInit() {
  }

  createAccount(): void {
    this.loginErrorStr = !this.email ? "email required" : null;
    if (!this.loginErrorStr) {
      this.appService.email = this.email;
      this.appService.checkForExistingUser(this.email).then(
        isExistingUser => {
          if (!isExistingUser)
            this.appService.getInvites(this.email).subscribe(invites => {
              if (invites.length > 0) this.router.navigate(["/join-team"]);
              else this.router.navigate(["/get-started"]);
            });
          else this.router.navigate(["/sign-in"]);
        },
        error => (this.loginErrorStr = error)
      );
    }
  }

}
