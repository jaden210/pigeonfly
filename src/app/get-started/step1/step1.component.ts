import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { GetStartedService } from "../get-started.service";

@Component({
  selector: "step1",
  templateUrl: "./step1.component.html",
  styleUrls: ["./step1.component.css"]
})
export class Step1Component implements OnInit {
  error: string;
  name: string;
  password: string;
  confirmPassword: string;
  loading: boolean = false;
  agree: boolean;

  constructor(
    private router: Router,
    private getStartedService: GetStartedService
  ) {}

  ngOnInit() {
    if (!this.getStartedService.Email) this.router.navigate(["/sign-up"]);
  }

  createAccount(): void {
    this.error = 
      !this.name ? "Please enter your name" :
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
      this.getStartedService.name = this.name;
      this.getStartedService.createAuthUser(this.password).then(
        (authUser: firebase.auth.UserCredential) => {
          this.getStartedService.createUser(authUser).then(
            () => {
              this.router.navigate(["/account/home"]);
              this.loading = false; 
            },
            error => {
              this.error = "Error creating user, please contact support";
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
