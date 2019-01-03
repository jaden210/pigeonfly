import { Component, OnInit } from "@angular/core";
import { AppService } from "../app.service";
import {
  RouterModule,
  Routes,
  Router,
  ActivatedRoute,
  ParamMap
} from "@angular/router";
declare var gtag: Function;

@Component({
  selector: "sign-up",
  templateUrl: "./sign-up.component.html",
  styleUrls: ["./sign-up.component.css"]
})
export class SignUpComponent implements OnInit {
  routes;

  constructor(
    public appService: AppService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {}

  signUp() {
    this.router.navigate(['/sign-up']);
    gtag("event", "click", {
      event_category: "sign up funnel",
      event_label: "start today guarantee"
    });
  }
}
