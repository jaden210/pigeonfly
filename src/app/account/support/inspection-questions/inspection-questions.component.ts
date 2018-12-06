import { Component, OnInit } from '@angular/core';
import { SupportService } from '../support.service';

@Component({
  selector: 'inspection-questions',
  templateUrl: './inspection-questions.component.html',
  styleUrls: ['./inspection-questions.component.css']
})
export class InspectionQuestionsComponent implements OnInit {

 
  collection: string = 'osha-assesment-template-en';
  list;

  collectionSubject: collectionSubject = new collectionSubject();
  newQuestion: NewQ = new NewQ();


  constructor(
    private supportService: SupportService
  ) { }

  ngOnInit() {
    this.getCollection();
  }
  
  getCollection() {
    this.supportService.getInspectionCollection(this.collection).subscribe(collection => {
      this.list = collection;
    });
  }

  selectDoc(item) {
    this.collectionSubject = item;
  }

  addQuestion() {
    this.newQuestion.createdAt = new Date();
    this.collectionSubject.questions.push({...this.newQuestion});
    this.supportService.db.collection(this.collection).doc(this.collectionSubject.id).update({...this.collectionSubject}).then(() => {
      this.newQuestion = new NewQ();
    });
  }

  deleteQ(q) {
    this.collectionSubject.questions.splice(this.collectionSubject.questions.indexOf(q),1);
    this.push();
  }

  push() {
    if (this.collectionSubject.id) {
      this.supportService.db.collection(this.collection).doc(this.collectionSubject.id).update({...this.collectionSubject});
    } else {
      this.supportService.db.collection(this.collection).add({...this.collectionSubject}).then(snapshot => {
        this.collectionSubject.id = snapshot.id;
        this.selectDoc(this.collectionSubject);
      });
    }
  }
  
  deleteDoc() {
    this.supportService.db.collection(this.collection).doc(this.collectionSubject.id).delete().then(() => {
    this.collectionSubject = new collectionSubject();
    });
  }

  createDoc() {
    this.collectionSubject = new collectionSubject();
  }

}

export class collectionSubject {
  id?: string;
  subject: string;
  questions: any;
  order: number = 0;
}

export class NewQ {
  id?: string;
  name: string;
  createdAt: Date;
}