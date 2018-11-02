import { Component, OnInit } from "@angular/core";
import { TrainingService, Industry } from "../training.service";
import { Router, ActivatedRoute } from "@angular/router";
import { Observable } from "rxjs";

@Component({
  selector: "app-industries",
  templateUrl: "./industries.component.html",
  styleUrls: ["./industries.component.css"]
})
export class IndustriesComponent implements OnInit {
  public industries: Observable<Industry[]>;

  constructor(
    private service: TrainingService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.service.setActiveRoute(null);
    this.industries = this.service.getIndustries();
  }

  public routeTo(industry): void {
    this.router.navigate([industry.id], { relativeTo: this.route });
  }
}
