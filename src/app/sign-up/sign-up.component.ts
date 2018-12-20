import { Component, OnInit } from "@angular/core";
import { AppService } from "../app.service";
import {
  RouterModule,
  Routes,
  Router,
  ActivatedRoute,
  ParamMap
} from "@angular/router";

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
}
