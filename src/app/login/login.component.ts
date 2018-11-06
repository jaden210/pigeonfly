import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { Router } from '@angular/router';
import { AppService, User } from '../app.service';
import { Team } from '../account/account.service';
declare var gtag: Function;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  login: Login = new Login();
  loginErrorStr: string;
  bSignUp: boolean = true;
  isVerified: boolean = false;
  bSetPassword: boolean = false;
  user: any;

  constructor(
    private auth: AngularFireAuth,
    public router: Router,
    public appService: AppService
  ) {
    this.appService.isUser ? this.bSignUp = false : this.bSignUp = true;
    }

  ngOnInit() {
  }
  
  checkEmail() {
    this.loginErrorStr = '';
    this.auth.auth.fetchSignInMethodsForEmail(this.login.email).then(data => {
      if (data.length > 0) { // they exist
        this.isVerified = true;
      } else { // no account, they are looking to join a team.
        let inviteCollection = this.appService.db.collection("invitation", ref => ref.where("inviteEmail", "==", this.login.email.toLowerCase()))
        inviteCollection.valueChanges().subscribe((invites: any) => {
          if (invites.length > 0) {
            this.login.invites = invites;
            this.bSetPassword = true;
          } else { // who are you??
            this.loginErrorStr = "We don't know who you are. if you want to create a team, click Create team below";
          } 
        })
      }
    }, error => {
      if (error.code == "auth/invalid-email") {
        this.loginErrorStr = "Please enter a valid email address";
      }
    })
  }
  
  joinTeam() {
    this.loginErrorStr = '';
    if (this.login.password !== this.login.password2) {
      this.loginErrorStr = "passwords do not match"
    } else {
      this.createAccount(false);
    }
  }
  
  signInEmail() {
    this.loginErrorStr = '';
    this.auth.auth.signInWithEmailAndPassword(this.login.email, this.login.password).then(
      data => {
        this.sendToAccount(false);
      },
      error => this.loginErrorStr = error.message
      )
    }
    
    createAccount(createTeam) {
      this.loginErrorStr = '';
      if (this.login.password !== this.login.password2) {
        this.loginErrorStr = "passwords do not match"
      } else {
        let teams;
        if (!createTeam) {
          this.login.invites.forEach(invite => { // the team is added here, so we only need to remove the invite in the accService.
            teams[invite.teamId] = invite.isAdmin ? 1 : 0;
          });
        }
        this.auth.auth.createUserWithEmailAndPassword(this.login.email, this.login.password).then(
          data => { // right now anyone can join with any email. we might want to send out a verify link
            this.user = {
              id: data.user.uid,
              email: data.user.email,
              profileUrl: data.user.photoURL || null,
              name: data.user.displayName || null,
              username: null,
              phone: data.user.phoneNumber || null,
              accountType: 'owner',
              teams: createTeam ? {} : teams
            };
            this.appService.db.collection<User>("user").doc(data.user.uid).set({...this.user}).then(() => {
              createTeam ? this.createTeam() : this.sendToAccount(true);
            });
          },
          error => {
            if (error.code == "auth/email-already-in-use") {
              this.auth.auth.signInWithEmailAndPassword(this.login.email, this.login.password).then(
                data => {
                  createTeam ? this.createTeam() : this.sendToAccount(false);
                },
                error => this.loginErrorStr = error.message
                ) 
              } else if (error.code == "auth/invalid email") {
                this.loginErrorStr = "Please enter a valid email address";
              } else {
                this.loginErrorStr = "were having trouble creating your account, try again later";
                // todo: send to google anayltics
              }
            });
          }
        }
        
        createTeam() {
          this.appService.firstTimeUser = true;
          gtag("event", "account_created", {
            event_category: "newAccount",
            event_label: "${user.name} created an account"
          });
          let newTeam = new Team();
          newTeam.createdAt = new Date();
          newTeam.ownerId = this.user.id;
          this.appService.db.collection("team").add({...newTeam}).then(snapshot => {
            this.user.teams[snapshot.id] = 1;
            this.appService.db.collection('user').doc(this.user.id).update({...this.user});
            this.sendToAccount(false)
            this.isUser();
    });
        }
        
        sendToAccount(removeFromInvite) {
          removeFromInvite ? this.appService.removeFromInvite = true : false;
          this.router.navigate(['account']);
        }
        
        isUser() {
          this.loginErrorStr = '';
          localStorage.setItem('cc-user', 'true');
          this.appService.isUser = true;
          this.bSignUp = false;
        }
        
        setSignUp() {
          this.loginErrorStr = '';
          localStorage.removeItem('cc-user');
          this.appService.isUser = false;
          this.bSignUp = true;
        }

}

export class Login {
  email: string;
  password: string;
  password2: string;
  invites?: any;
}