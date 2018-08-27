import { Component, OnInit, Pipe } from '@angular/core';
import { AppService } from '../app.service';
import { map } from "rxjs/operators";
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { DomSanitizer, SafeHtml, SafeStyle, SafeUrl, SafeScript, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-make-osha',
  templateUrl: './make-osha.component.html',
  styleUrls: ['./make-osha.component.css']
})
export class AssesComponent implements OnInit {

 
  collection: string = 'osha-assesment-template-en';
  list;
  listId;

  newDoc: NewDoc = new NewDoc();
  newQuestion: NewQ = new NewQ();


  constructor(
    public appService: AppService
  ) { }

  ngOnInit() {
    this.get();
  }

  get() {
    let collection = this.appService.db.collection(this.collection, ref => ref.orderBy("subject", "asc"));
    collection.snapshotChanges().pipe(
      map(actions => actions.map(a => { //better way
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    ).subscribe(collection => {
      this.list = collection;
    });
  }

  selectDoc(item) {
    this.newDoc = item;
    let questions = this.appService.db.collection(this.collection).doc(item.id).collection('questions')
    questions.snapshotChanges().pipe(
      map(actions => actions.map(a => { //better way
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    ).subscribe(questions => {
      this.newDoc.questions = questions;
    });
  }

  addQuestion() {
    let d = this.newDoc;
    delete d.questions;
    this.appService.db.collection(this.collection).doc(d.id).collection('questions').add({...this.newQuestion}).then(() => {
      this.newQuestion = new NewQ();
    });
  }

  updateQ(q) {
    this.appService.db.collection(this.collection).doc(this.newDoc.id).collection('questions').doc(q.id).update({... q});
  }

  deleteQ(q) {
    this.appService.db.collection(this.collection).doc(this.newDoc.id).collection('questions').doc(q.id).delete();
  }

  push() {
    if (this.newDoc.id) {
      this.appService.db.collection(this.collection).doc(this.newDoc.id).update({...this.newDoc}).then(() => {
        this.newDoc = new NewDoc();
      });
    } else {
      this.appService.db.collection(this.collection).add({...this.newDoc}).then(() => {
        this.newDoc = new NewDoc();
      });
    }
  }
  
  deleteDoc() {
    let dq = this.appService.db.collection(this.collection).doc(this.newDoc.id).collection('questions');
    dq.snapshotChanges().pipe(
      map(actions => actions.map(a => { //better way
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    ).subscribe(questions => {
      questions.forEach(q => {
        let dq = this.appService.db.collection(this.collection).doc(this.newDoc.id).collection('questions').doc(q.id).delete();
      })
    });
    this.appService.db.collection(this.collection).doc(this.newDoc.id).delete().then(() => {
    this.newDoc = new NewDoc();
    })
  }

  createDoc() {
    this.newDoc = new NewDoc();
  }

}


export class NewDoc {
  id?: string;
  subject: string;
  questions: any;
  order: number = 0;
}

export class NewQ {
  id?: string;
  name: string;
}