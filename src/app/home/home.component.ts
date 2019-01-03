import { Component, OnInit } from "@angular/core";
import { AppService } from "../app.service";
import { Router } from "@angular/router";
import { AngularFireAuth } from "@angular/fire/auth";
declare var gtag: Function;

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"]
})
export class HomeComponent implements OnInit {
  loginErrorStr;
  email;

  constructor(
    public appService: AppService,
    private router: Router,
    public auth: AngularFireAuth
  ) {}

  ngOnInit() {}

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
          else {
            gtag("event", "click", {
              event_category: "sign up funnel",
              event_label: "create account"
            });
            this.router.navigate(["/sign-in"]);
            return false;
          }
        },
        error => (this.loginErrorStr = error)
      );
    }
  }

  routeSignUp() {
    this.auth.auth.onAuthStateChanged(user => {
      if (user && user.uid) {
        this.router.navigate(["account"]);
      } else {
        gtag("event", "click", {
          event_category: "sign up funnel",
          event_label: "start today its free"
        });
        this.router.navigate(["/sign-up"]);
      }
    });
  }
}
