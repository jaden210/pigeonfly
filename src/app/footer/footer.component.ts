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
  selector: "footer",
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.css"]
})
export class FooterComponent implements OnInit {
  routes;
  constructor(
    public appService: AppService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {}

}
