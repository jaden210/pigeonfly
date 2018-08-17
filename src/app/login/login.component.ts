import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { Router } from '@angular/router';
import { AppService, User } from '../app.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  login: Login = new Login();
  loginErrorStr: string;

  constructor(
    private auth: AngularFireAuth,
    public router: Router,
    private appService: AppService
  ) { }

  ngOnInit() {
  }

  signInEmail() {
    this.loginErrorStr = '';
    this.auth.auth.createUserWithEmailAndPassword(this.login.email, this.login.password).then(
      data => {
        this.appService.db.collection<User>("user").doc(data.user.uid).set({ // create user in system
          uid: data.user.uid,
          email: data.user.email,
          profileUrl: data.user.photoURL || null,
          name: data.user.displayName || null,
          username: null,
          phone: data.user.phoneNumber || null,
          accountType: 'owner',
          teams: {}
        }).then(() => {
          this.sendToAccount(); // less efficient but more uniform
        });
      },
      error => {
        if (error.code == "auth/email-already-in-use") {
          this.auth.auth.signInWithEmailAndPassword(this.login.email, this.login.password).then(
            data => {
              this.sendToAccount();
            },
            error => this.loginErrorStr = error.message
          )
        } else {
          this.loginErrorStr = error.message;
        }
      }
    )
  }

  sendToAccount() {
    this.router.navigate(['account']);
  }

}

export class Login {
  email: string;
  password: string;
  name?: string;
}