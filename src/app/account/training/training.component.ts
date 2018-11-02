import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { TrainingService } from "./training.service";
import { Location } from "@angular/common";
import { AccountService } from "../account.service";

@Component({
  selector: "app-training",
  templateUrl: "./training.component.html",
  styleUrls: ["./training.component.css"]
})
export class TrainingComponent implements OnInit {
  constructor(
    private router: Router,
    private service: TrainingService,
    private location: Location,
    private accountService: AccountService
  ) {}

  ngOnInit() {
    this.accountService.aTeamObservable.subscribe(team => {
      // if (team) this.service.getMyContent(team.id).subscribe();
    });
  }

  public goBack(): void {
    const activeRoute: string = this.router.url;
    if (
      activeRoute.includes("create-article") ||
      activeRoute.includes("edit-article")
    )
      this.location.back();
    else {
      const backRoute = activeRoute.substr(0, activeRoute.lastIndexOf("/"));
      this.router.navigate([backRoute]);
    }
  }

  public get ActiveRoute(): string {
    return this.service.getActiveRoute();
  }
}
