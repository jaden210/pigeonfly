import { Component, Inject } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { AppService } from "./app.service";
import { AngularFireAuth } from "@angular/fire/auth";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
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
        //gtag("config", "UA-125391496-1", { page_path: event.url });
      }
      if (!(event instanceof NavigationEnd)) {
        return;
      }
      document.getElementById("scroll").scrollTop = 0;
    });
    this.auth.auth.onAuthStateChanged(user => {
      if (user && user.uid) {
        this.appService.loggedInStatus = "Account";
      }
    });
  }

  navRoute(link?) {
    this.open = false;
    this.router.navigate([link]);
  }
  
  goToBlog() {
    window.open("https://blog.GymJumper.com");
  }
  
  routeSignUp(link?) {
    this.open = false;
    this.auth.auth.onAuthStateChanged(user => {
      if (user && user.uid) {
        this.router.navigate(["account"]);
      } else {
        this.router.navigate([link]);
      }
    });
  }
}
