import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppService } from './app.service';
import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(
    public router: Router,
    public appService: AppService,
    public auth: AngularFireAuth
  ) { 
    if(localStorage.getItem("minute-user")) { //they have been here before
      this.appService.isUser = true;
      this.auth.auth.onAuthStateChanged(user => {
        if (user.uid) {
          console.log(this.appService.isUser);
          this.appService.isLoggedIn = true;
        } 
      });
    }
  }
  
}