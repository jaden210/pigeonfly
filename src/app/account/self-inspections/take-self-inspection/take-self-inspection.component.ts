import { Component } from "@angular/core";
import { SelfInspectionsService, Question, Categories } from "../self-inspections.service";
import { MatSnackBar, MatDialog } from "@angular/material";
import { ActivatedRoute, Router } from "@angular/router";
import { Location, DatePipe } from "@angular/common";

@Component({
  selector: "app-take-self-inspection",
  templateUrl: "./take-self-inspection.component.html",
  styleUrls: ["./take-self-inspection.component.css"]
})
export class TakeSelfInspectionComponent {

  aCategory: Categories;
  aQuestion: Question;
  count: string;

  constructor(
    private selfInspectionsService: SelfInspectionsService,
    private snackbar: MatSnackBar,
    private router: Router,
    private location: Location
  ) {
    !this.selfInspectionsService.selfInspection ? this.router.navigate(['account/self-inspections']) : null;
    this.aCategory = this.selfInspectionsService.takeInspection.categories[0];
    this.aCategory.show = true;
    this.aQuestion = this.aCategory.questions[0];
    this.getCount();
  }

  getCount() {
    let answeredQuestions = 0;
    let compliantAnswers = 0;
    let totalQuestions = 0;
    this.selfInspectionsService.takeInspection.categories.forEach(category => {
      category.questions.forEach(question => {
        if (question.answer !== undefined) answeredQuestions ++;
        if (question.answer == true) compliantAnswers ++;
        totalQuestions ++;
      });
    });
    this.count = answeredQuestions + '/' + totalQuestions;
    this.selfInspectionsService.takeInspection.completedPercent = answeredQuestions/totalQuestions;
    this.selfInspectionsService.takeInspection.compliantPercent = compliantAnswers/totalQuestions;
  }

  finishAndLeave() {
    this.selfInspectionsService.finishSelfInspection().then(() => {
      this.location.back();
    });
  }

  saveAndLeave() {
    this.selfInspectionsService.saveSelfInspection().then(() => {
      this.location.back();
    });
  }

  deleteSelfInspection() {
    this.selfInspectionsService.deleteSelfInspection().then(() => {
      this.router.navigate(["/account/self-inspections"]);
      this.selfInspectionsService.selfInspection = null;
    })
    .catch(error => {
      let snackbar = this.snackbar.open("error deleting Self Inspection...", null, {
        duration: 3000
      });
      console.log(error);
    });
  }

  answerQuestion(value) {
    this.aCategory.questions.find(question => question == this.aQuestion).answer = value;
    let unanswered: boolean = false;
    this.aCategory.questions.forEach(aquestion => {
      if (aquestion.answer == undefined) unanswered = true;
    });
    if (!unanswered) this.aCategory.finished = true; 
    this.getCount();
  }

  selectQuestion(question) {
    this.aQuestion = question;
    this.aCategory = this.selfInspectionsService.takeInspection.categories.find(category =>  category.questions.find(aquestion => aquestion == question) == question)
    this.aCategory.show = true;
  }

  nextQuestion() {
    let catLength = this.selfInspectionsService.takeInspection.categories.length - 1;
    let curCatIndex = this.selfInspectionsService.takeInspection.categories.indexOf(this.aCategory);
    let qLength = this.aCategory.questions.length - 1;
    let curQIndex = this.aCategory.questions.indexOf(this.aQuestion);
    if (curQIndex < qLength) { // go next question
      this.aQuestion = this.aCategory.questions[curQIndex + 1];
    } else if (curQIndex == qLength) { // next sub
      if (curCatIndex < catLength) { // next sub
        this.aCategory.show = false;
        this.aCategory = this.selfInspectionsService.takeInspection.categories[curCatIndex + 1];
        this.aCategory.show = true;
        this.aQuestion = this.aCategory.questions[0];
      } else if (curCatIndex == catLength) { 
        this.aCategory.show = false;
        this.aCategory = this.selfInspectionsService.takeInspection.categories[0];
        this.aCategory.show = true;
        this.aQuestion = this.aCategory.questions[0];
      } else {
        return;
      }
    } else {
      return;
    }
  }
}