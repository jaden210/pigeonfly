import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { GetStartedService } from "../get-started.service";

@Component({
  selector: "step1",
  templateUrl: "./step1.component.html",
  styleUrls: ["./step1.component.css"]
})
export class Step1Component implements OnInit {
  error: string;
  name: string;
  companyName: string;
  jobTitle: string;

  constructor(
    private router: Router,
    private getStartedService: GetStartedService
  ) {}

  ngOnInit() {
    if (!this.getStartedService.Email) this.router.navigate(["/sign-up"]);
    this.companyName = this.getStartedService.companyName;
    this.name = this.getStartedService.name;
    this.jobTitle = this.getStartedService.jobTitle;
  }

  next(): void {
    this.error =
      !this.companyName || !this.name ? "Please enter the required items" : "";
    if (!this.error) {
      this.getStartedService.companyName = this.companyName;
      this.getStartedService.name = this.name;
      this.getStartedService.jobTitle = this.jobTitle;
      this.router.navigate(["/get-started/step2"]);
    }
  }
}
