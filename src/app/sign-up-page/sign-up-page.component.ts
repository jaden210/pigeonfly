import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { AppService } from "../app.service";

@Component({
  selector: "app-sign-up-page",
  templateUrl: "./sign-up-page.component.html",
  styleUrls: ["./sign-up-page.component.css"]
})
export class SignUpPageComponent {
  loginErrorStr: string;
  email: string;

  constructor(public router: Router, public appService: AppService) {}

  createAccount(): void {
    this.loginErrorStr = !this.email ? "email required" : null;
    if (!this.loginErrorStr) {
      this.appService.email = this.email;
      this.appService.checkForExistingUser(this.email).then(
        isExistingUser => {
          if (!isExistingUser) {
            this.router.navigate(["/get-started"]);
          } else this.router.navigate(["/sign-in"]);
        },
        error => (this.loginErrorStr = error)
      );
    }
  }
}
