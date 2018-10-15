import { Component, OnInit, ViewChild } from "@angular/core";
import { trigger, style, transition, animate } from "@angular/animations";
import { Timeclock, AccountService } from "../account.service";
import { AngularFireAuth } from "angularfire2/auth";
import { Router } from "@angular/router";

@Component({
  selector: "toolbar-helper",
  templateUrl: "./toolbar-helper.component.html",
  styleUrls: ["./toolbar-helper.component.css"],
  providers: []
})
export class ToolbarHelperComponent implements OnInit {

  constructor(
    public accountService: AccountService,
    public auth: AngularFireAuth,
    public router: Router
  ) {}

  ngOnInit() {
    
  }

  logout() {
    localStorage.removeItem('teamId');
    this.auth.auth.signOut().then(() => {
      this.router.navigate(['home']);
    })
  }
}
