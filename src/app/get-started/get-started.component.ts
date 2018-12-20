import { Component, OnInit } from "@angular/core";
import { GetStartedService } from "./get-started.service";

@Component({
  selector: "get-started",
  templateUrl: "./get-started.component.html",
  styleUrls: ["./get-started.component.css"]
})
export class GetStartedComponent implements OnInit {
  constructor(private getStartedService: GetStartedService) {}

  ngOnInit() {
    this.getStartedService.setIndustries();
  }
}
