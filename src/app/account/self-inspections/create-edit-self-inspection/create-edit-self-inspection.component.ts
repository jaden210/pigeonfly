import { Component } from "@angular/core";
import { SelfInspectionsService, ExperationTimeFrame, SelfInspection } from "../self-inspections.service";
import { MatSnackBar } from "@angular/material";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { Location } from "@angular/common";
import { Subscription } from "rxjs";
import { AccountService } from "../../account.service";

@Component({
  selector: "app-create-edit-self-inspection",
  templateUrl: "./create-edit-self-inspection.component.html",
  styleUrls: ["./create-edit-self-inspection.component.css"]
})
export class CreateEditSelfInspectionComponent {

  subscription: Subscription;
  selfInspection: SelfInspection = new SelfInspection();
  newQuestionText: string; // template variable

  constructor(
    public router: Router,
    public route: ActivatedRoute,
    private accountService: AccountService,
    public selfInspectionService: SelfInspectionsService,
    public snackbar: MatSnackBar,
    private location: Location
  ) {
    this.subscription = this.accountService.aTeamObservable.subscribe(team => {
      if (team) {
        this.route.paramMap.subscribe((params: ParamMap) => {
          let selfInspectionId = params.get("selfInspectionId");
          if (selfInspectionId) { //edit
            this.selfInspectionService.getSelfInspection(selfInspectionId).subscribe(selfInspection => {
              this.selfInspection = selfInspection;
              this.selfInspectionService.setSelfInspectionWithTemplate(selfInspection);
            });
          } else { //create
            this.selfInspectionService.setSelfInspectionWithTemplate(this.selfInspection);
          }
        });
      }
    })
  }

  leave(snapshot) {
    this.subscription.unsubscribe();
    this.router.navigate([`/account/self-inspections/${this.selfInspection.id || snapshot.id}`]);
  }
  
  cancel() {
    this.subscription.unsubscribe();
    this.router.navigate([`/account/self-inspections`]);
  }

  saveOrCreate() {
    this.selfInspectionService.saveOrCreateNewSelfInspection(this.selfInspection).then(snapshot => {
      this.leave(snapshot);
    })
    .catch(error => {
      let snackbar = this.snackbar.open("error creating Inspection...", null, {
        duration: 3000
      });
      console.log(error);
    });
  }

  getLength(q): number { // could be better
    if (q) {
      let i = 0;
      q.forEach(q => {
        q.selected ? i ++ : null;
      });
      return i;
    }
    return 0;
  }

  addQuestion(index): void {
    this.selfInspection.baseQuestions[index].questions.push({
      name: this.newQuestionText,
      selected: true
    });
    this.newQuestionText = '';
  }

  public get timeFrame(): string[] {
    return Object.keys(ExperationTimeFrame).map(key => ExperationTimeFrame[key]);
  }
}
