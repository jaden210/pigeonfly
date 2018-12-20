import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { FormControl, Validators } from "@angular/forms";
import { AngularFireAuth } from "@angular/fire/auth";
import { AppService } from "../app.service";
import { MatSnackBar } from "@angular/material";
declare var gtag: Function;

@Component({
  selector: "sign-in",
  templateUrl: "./sign-in.component.html",
  styleUrls: ["./sign-in.component.css"]
})
export class SignInComponent {
  email: FormControl;
  password: FormControl;
  signinError: string;
  showResetPassword: boolean;

  constructor(
    private router: Router,
    private auth: AngularFireAuth,
    private appService: AppService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    let emailStr = this.appService.email || "";
    this.email = new FormControl(emailStr, [
      Validators.required,
      Validators.email
    ]);
    this.password = new FormControl("", [Validators.required]);
  }

  getEmailErrorMessage() {
    return this.email.hasError("required")
      ? "email required"
      : this.email.hasError("email")
      ? "not a valid email"
      : "";
  }

  signIn(): void {
    this.signinError = null;
    this.auth.auth
      .signInWithEmailAndPassword(this.email.value, this.password.value)
      .then(
        () => this.router.navigate(["/account"]),
        error => {
          console.error(error);
          if (error.code == "auth/user-not-found") {
            this.appService.getInvites(this.email.value).subscribe(invites => {
              if (invites.length > 0) this.router.navigate(["/join-team"]);
              else
                this.signinError =
                  "No users found matching this email address, create a team or ask your employer to add you to their team";
            });
          } else if (error.code == "auth/wrong-password") {
            this.showResetPassword = true;
            this.signinError = "Your password is invalid";
          } else this.signinError = error.message;
        }
      );
  }

  resetPassword(email: string) {
    return this.auth.auth
      .sendPasswordResetEmail(email)
      .then(() => {
        this.signinError = null;
        // pop snackbar
        this.snackBar.open(`Reset password email sent to ${email}`, null, {
          duration: 6000
        });
        this.password.setValue(null);
        this.password.markAsPristine();
        gtag("event", "password_reset", {
          event_category: "password",
          event_label: `${this.email.value} reset a password`
        });
        console.log("sent Password Reset Email!");
      })
      .catch(error => console.log(error));
  }
}
