import { Component } from "@angular/core";
import { SelfInspectionsService, SelfInspection } from "../self-inspections.service";
import { AccountService } from "../../account.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Component({
  selector: "app-self-inspection",
  templateUrl: "./self-inspections-list.component.html",
  styleUrls: ["./self-inspections-list.component.css"]
})
export class SelfInspectionsListComponent {

  selfInspections: Observable<SelfInspection[]>;

  constructor(
    public router: Router,
    public route: ActivatedRoute,
    private selfInspectionsService: SelfInspectionsService,
    public accountService: AccountService,
  ) {
    this.accountService.helper = this.accountService.helperProfiles.selfInspection;
    this.accountService.aTeamObservable.subscribe(team => {
      if (team) {
        this.selfInspections = this.selfInspectionsService.getSelfInspections().pipe(
          tap(results => {
            results.length == 0 ? this.accountService.showHelper = true : null;
          })
        );
      }
    });
  }

  selectSelfInspection(inspection) {
    this.selfInspectionsService.selfInspection = inspection;
    this.router.navigate([inspection.id], { relativeTo: this.route });
  }

  startNewSelfInspection() {
    this.selfInspectionsService.selfInspection = new SelfInspection();
    this.router.navigate(['new'], { relativeTo: this.route });
  }
}
