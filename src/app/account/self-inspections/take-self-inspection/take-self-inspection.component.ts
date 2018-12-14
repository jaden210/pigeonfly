import { Component } from "@angular/core";
import { SelfInspectionsService, Question, Categories, DeleteInspectionDialog, SelfInspection, Inspection } from "../self-inspections.service";
import { MatSnackBar, MatDialog } from "@angular/material";
import { ActivatedRoute, Router, ParamMap } from "@angular/router";
import { Location, DatePipe } from "@angular/common";
import { Subscription } from "rxjs";
import { AccountService } from "../../account.service";

@Component({
  selector: "app-take-self-inspection",
  templateUrl: "./take-self-inspection.component.html",
  styleUrls: ["./take-self-inspection.component.css"]
})
export class TakeSelfInspectionComponent {

  subscription: Subscription;
  selfInspection: SelfInspection = new SelfInspection();
  inspection: Inspection = new Inspection();
  aCategory: Categories;
  aQuestion: Question = new Question();
  count: string;

  constructor(
    private accountService: AccountService,
    public selfInspectionsService: SelfInspectionsService,
    private snackbar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router,
    public location: Location,
    public dialog: MatDialog
  ) {
    this.subscription = this.accountService.aTeamObservable.subscribe(team => {
      if (team) {
        this.route.paramMap.subscribe((params: ParamMap) => {
          let selfInspectionId = params.get("selfInspectionId");
          let inspectionId = params.get("inspectionId");
          this.selfInspectionsService.getSelfInspection(selfInspectionId).subscribe(si => this.selfInspection = si);
          this.selfInspectionsService.getSelfInspectionInspection(selfInspectionId, inspectionId).subscribe(inspection => {
            this.inspection = inspection;
            this.aCategory = inspection.categories[0];
            this.aCategory.show = true;
            this.aQuestion = this.aCategory.questions[0];
            this.getCount();
          });
        });
      }
    });
  }

  getCount() {
    let answeredQuestions = 0;
    let compliantAnswers = 0;
    let totalQuestions = 0;
    this.inspection.categories.forEach(category => {
      category.questions.forEach(question => {
        if (question.answer !== undefined) answeredQuestions ++;
        if (question.answer == true) compliantAnswers ++;
        totalQuestions ++;
      });
    });
    this.count = answeredQuestions + '/' + totalQuestions;
    this.inspection.completedPercent = Math.round((answeredQuestions/totalQuestions)*100);
    this.inspection.compliantPercent = Math.round((compliantAnswers/totalQuestions)*100);
  }

  finishAndLeave() {
    this.selfInspectionsService.finishSelfInspection(this.inspection, this.selfInspection).then(() => {
      this.routeBack();
    });
  }

  saveAndLeave() {
    this.selfInspectionsService.saveSelfInspection(this.inspection, this.selfInspection).then(() => {
      this.routeBack();
    });
  }

  deleteSelfInspectionInspection() {
    let dialog = this.dialog.open(DeleteInspectionDialog);
    dialog.afterClosed().subscribe(bDelete => {
      if (bDelete) {
        this.selfInspectionsService.deleteSelfInspectionInspection(this.inspection, this.selfInspection).then(() => {
          this.routeBack();
        })
        .catch(error => {
          let snackbar = this.snackbar.open("error deleting Self Inspection...", null, {
            duration: 3000
          });
          console.log(error);
        });
      }
    })
  }

  routeBack() {
    this.subscription.unsubscribe();
    this.router.navigate([`/account/self-inspections/${this.selfInspection.id}`]);
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
    this.aCategory = this.inspection.categories.find(category =>  category.questions.find(aquestion => aquestion == question) == question)
    this.aCategory.show = true;
  }

  nextQuestion() {
    let catLength = this.inspection.categories.length - 1;
    let curCatIndex = this.inspection.categories.indexOf(this.aCategory);
    let qLength = this.aCategory.questions.length - 1;
    let curQIndex = this.aCategory.questions.indexOf(this.aQuestion);
    if (curQIndex < qLength) { // go next question
      this.aQuestion = this.aCategory.questions[curQIndex + 1];
    } else if (curQIndex == qLength) { // next sub
      if (curCatIndex < catLength) { // next sub
        this.aCategory.show = false;
        this.aCategory = this.inspection.categories[curCatIndex + 1];
        this.aCategory.show = true;
        this.aQuestion = this.aCategory.questions[0];
      } else if (curCatIndex == catLength) { 
        this.aCategory.show = false;
        this.aCategory = this.inspection.categories[0];
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