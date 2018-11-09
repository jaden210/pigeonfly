import { Component, OnInit, Pipe } from '@angular/core';
import { AccountService } from '../../account.service';
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
    public accountService: AccountService
  ) { }

  ngOnInit() {
    this.get();
  }

  get() {
    let collection = this.accountService.db.collection(this.collection, ref => ref.orderBy("order", "asc"));
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
    let questions = this.accountService.db.collection(this.collection).doc(item.id).collection('questions', ref => ref.orderBy('createdAt'))
    questions.snapshotChanges().pipe(
      map(actions => actions.map(a => { //better way
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        const createdAt = data.createdAt ? data.createdAt.toDate() : null
        return { id, createdAt, ...data };
      }))
    ).subscribe(questions => {
      this.newDoc.questions = questions;
    });
  }

  addQuestion() {
    let d = this.newDoc;
    delete d.questions;
    this.newQuestion.createdAt = new Date();
    this.accountService.db.collection(this.collection).doc(d.id).collection('questions').add({...this.newQuestion}).then(() => {
      this.newQuestion = new NewQ();
    });
  }

  updateQ(q) {
    q.createdAt = new Date();
    this.accountService.db.collection(this.collection).doc(this.newDoc.id).collection('questions').doc(q.id).update({... q});
  }

  deleteQ(q) {
    this.accountService.db.collection(this.collection).doc(this.newDoc.id).collection('questions').doc(q.id).delete();
  }

  push() {
    if (this.newDoc.id) {
      this.accountService.db.collection(this.collection).doc(this.newDoc.id).update({...this.newDoc}).then(() => {
      });
    } else {
      this.accountService.db.collection(this.collection).add({...this.newDoc}).then(snapshot => {
        this.newDoc.id = snapshot.id;
        this.selectDoc(this.newDoc);
      });
    }
  }
  
  deleteDoc() {
    let dq = this.accountService.db.collection(this.collection).doc(this.newDoc.id).collection('questions');
    dq.snapshotChanges().pipe(
      map(actions => actions.map(a => { //better way
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    ).subscribe(questions => {
      questions.forEach(q => {
        let dq = this.accountService.db.collection(this.collection).doc(this.newDoc.id).collection('questions').doc(q.id).delete();
      })
    });
    this.accountService.db.collection(this.collection).doc(this.newDoc.id).delete().then(() => {
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
  createdAt: Date;
}