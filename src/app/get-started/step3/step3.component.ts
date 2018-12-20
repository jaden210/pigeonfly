import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { GetStartedService } from "../get-started.service";

@Component({
  selector: "step2",
  templateUrl: "./step3.component.html",
  styleUrls: ["./step3.component.css"]
})
export class Step3Component implements OnInit {
  password: string;
  confirmPassword: string;
  error: string;
  agree: boolean;
  loading: boolean;

  constructor(
    private router: Router,
    private getStartedService: GetStartedService
  ) {}

  ngOnInit() {
    if (
      !this.getStartedService.Email ||
      !this.getStartedService.companyName ||
      !this.getStartedService.name ||
      !this.getStartedService.industryId
    )
      this.router.navigate(["/get-started"]);
  }

  createAccount(): void {
    this.error =
      !this.password || !this.confirmPassword
        ? "Please enter the required items"
        : this.password.length < 6
        ? "Password must be at least 6 characters"
        : this.password !== this.confirmPassword
        ? "Passwords do not match"
        : !this.agree
        ? "Please agree to the terms of service, privacy policy and customer agreement"
        : null;
    if (!this.error && !this.loading) {
      this.loading = true;
      this.getStartedService.createAuthUser(this.password).then(
        (authUser: firebase.auth.UserCredential) => {
          this.getStartedService.createTeam(authUser.user.uid).then(
            teamId => {
              this.getStartedService.createUser(authUser, teamId).then(
                () => {
                  this.getStartedService.setDefaultArticles(
                    teamId,
                    authUser.user.uid
                  );
                  this.getStartedService.createCompletedAchievement(teamId);
                  this.loading = false;
                  this.router.navigate(["/account/achievements"]);
                },
                error => {
                  this.error = "Error creating user, please contact support";
                  this.loading = false;
                }
              );
            },
            error => {
              this.error = "Error creating team, please contact support";
              this.loading = false;
            }
          );
        },
        error => {
          this.loading = false;
          this.error =
            error.code == "auth/email-already-in-use"
              ? ""
              : error.code == "auth/invalid email"
              ? "Please enter a valid email address"
              : "We're having trouble creating your account, try again later";
        }
      );
    }
  }
}
