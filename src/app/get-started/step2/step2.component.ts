import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { GetStartedService } from "../get-started.service";
import { Industry } from "src/app/account/training/training.service";
declare var gtag: Function;

@Component({
  selector: "step2",
  templateUrl: "./step2.component.html",
  styleUrls: ["./step2.component.css"]
})
export class Step2Component implements OnInit {
  constructor(
    private router: Router,
    private getStartedService: GetStartedService
  ) {}

  ngOnInit() {
    console.log(
      this.getStartedService.name,
      this.getStartedService.companyName,
      this.getStartedService.Email
    );
    if (
      !this.getStartedService.name ||
      !this.getStartedService.companyName ||
      !this.getStartedService.Email
    )
      this.router.navigate(["/get-started"]);
  }

  setIndustry(industry: Industry): void {
    this.getStartedService.industryId = industry.id;
    gtag("event", "click", {
      event_category: "sign up funnel",
      event_label: "step 2"
    });
    this.router.navigate(["/get-started/step3"]);
  }

  get Industries(): Industry[] {
    return this.getStartedService.industries;
  }
}
