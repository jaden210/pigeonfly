import { Component } from '@angular/core';
import { Router, NavigationEnd } from "@angular/router";
import { AppService } from './app.service';
import { AngularFireAuth } from 'angularfire2/auth';
declare var gtag: Function;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  open: boolean = false;
  body: HTMLElement;

  constructor(
    public router: Router,
    public appService: AppService,
    public auth: AngularFireAuth
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        gtag('config', 'UA-125391496-1', {'page_path': event.url});      
      }
      if (!(event instanceof NavigationEnd)) {
        return;
      }
      document.getElementById('scroll').scrollTop = 0;
    });
    if(localStorage.getItem("cc-user")) { //they have been here before
      this.appService.isUser = true;
      this.auth.auth.onAuthStateChanged(user => {
        if (user && user.uid) {
          console.log(this.appService.isUser);
          this.appService.isLoggedIn = true;
        } 
      });
    }
  }

  navRoute(link?) {
    this.open = false;
    this.router.navigate([link]);
  }
  
}