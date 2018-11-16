import { Component } from "@angular/core";
import { SelfInspectionsService } from "../self-inspections.service";
import { MatSnackBar } from "@angular/material";
import { Router } from "@angular/router";
import { Location } from "@angular/common";

@Component({
  selector: "app-create-edit-self-inspection",
  templateUrl: "./create-edit-self-inspection.component.html",
  styleUrls: ["./create-edit-self-inspection.component.css"]
})
export class CreateEditSelfInspectionComponent {

  newQuestionText: string; // template variable

  constructor(
    public router: Router,
    private selfInspectionService: SelfInspectionsService,
    public snackbar: MatSnackBar,
    private location: Location
  ) {
    if (!this.selfInspectionService.selfInspection) {
      this.location.back();
      return;
    };
    this.selfInspectionService.setSelfInspectionWithTemplate();
  }

  leave() {
    this.router.navigate(["/account/self-inspections"]);
    this.selfInspectionService.selfInspection = null;
  }

  saveOrCreate() {
    this.selfInspectionService.saveOrCreateNewSelfInspection().then(() => {
      this.leave();
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
    this.selfInspectionService.selfInspection.baseQuestions[index].questions.push({
      name: this.newQuestionText,
      selected: true
    });
    this.newQuestionText = '';
  }
}
