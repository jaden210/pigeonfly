import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { JoinTeamService } from "./join-team.service";
import { AppService } from "../app.service";
import { FormControl, Validators } from "@angular/forms";

@Component({
  selector: "join-team",
  templateUrl: "./join-team.component.html",
  styleUrls: ["./join-team.component.css"],
  providers: [JoinTeamService]
})
export class JoinTeamComponent implements OnInit {
  email: string;
  emailCtrl: FormControl;
  emailError: string;
  password: string;
  confirmPassword: string;
  error: string;
  activeInvite: any;

  constructor(
    private router: Router,
    private joinTeamService: JoinTeamService,
    private appService: AppService
  ) {}

  ngOnInit() {
    this.email = this.appService.email || "";
    this.emailCtrl = new FormControl(this.email, [
      Validators.required,
      Validators.email
    ]);
    if (this.appService.invites && this.appService.invites.length) {
      this.activeInvite = this.appService.invites[0];
    }
  }

  getEmailErrorMessage() {
    return this.emailCtrl.hasError("required")
      ? "email required"
      : this.emailCtrl.hasError("email")
      ? "not a valid email"
      : "";
  }

  next(): void {
    this.email = this.emailCtrl.value;
    this.appService.getInvites(this.email).subscribe(invites => {
      if (invites.length) {
        this.activeInvite = invites[0];
      } else {
        this.emailError = "No invitaions were found matching this email";
      }
    });
  }

  createUser() {
    this.error =
      !this.password || !this.confirmPassword
        ? "Please enter the required items"
        : this.password.length < 6
        ? "Password must be at least 6 characters"
        : this.password !== this.confirmPassword
        ? "Passwords do not match"
        : null;
    if (!this.error)
      this.joinTeamService.createAuthUser(this.password, this.email).then(
        (authUser: firebase.auth.UserCredential) => {
          this.joinTeamService
            .createUser(
              authUser,
              this.activeInvite.teamId,
              this.activeInvite.isAdmin || 0,
              this.activeInvite.inviteName || null
            )
            .then(() => {
              this.joinTeamService.removeFromInvitaionCollection(
                this.activeInvite.id
              );
              this.router.navigate(["/account"]);
            });
        },
        error => {
          console.error(error);
          this.error =
            error.code == "auth/email-already-in-use"
              ? "This email is already in use by another account, please contact support"
              : error.code == "auth/invalid email"
              ? "Please enter a valid email address"
              : "We're having trouble creating your account, try again later";
        }
      );
  }
}
