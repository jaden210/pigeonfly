import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { TrainingService } from "./training.service";
import { Location } from "@angular/common";
import { AccountService } from "../account.service";

@Component({
  selector: "app-training",
  template: `
    <mat-toolbar style="font-size: 15px">
      <button
        mat-icon-button
        *ngIf="ActiveRoute != 'Select an Industry'"
        (click)="goBack()"
      >
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1>{{ ActiveRoute }}</h1>
      <div class="flex"></div>
      <toolbar-helper></toolbar-helper>
    </mat-toolbar>
    <router-outlet></router-outlet>
  `
})
export class TrainingComponent {
  constructor(
    private router: Router,
    private service: TrainingService,
    private location: Location
  ) {}

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

  public get NavBack(): boolean {
    return this.service.getActiveRoute() != "Select an Industry" ? true : false;
  }
}
