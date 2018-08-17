import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';
import { map } from "rxjs/operators";

@Component({
  selector: 'app-make-osha',
  templateUrl: './make-osha.component.html',
  styleUrls: ['./make-osha.component.css']
})
export class MakeOSHAComponent implements OnInit {

  parentCollection: string= 'user';
  collection: string = 'u';
  list;
  parentList;

  columnName1;
  columnField1;

  constructor(
    public appService: AppService
  ) { }

  ngOnInit() { }
  get() {
    let collection = this.appService.db.collection(this.collection);
    collection.snapshotChanges().pipe(
      map(actions => actions.map(a => { //better way
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    ).subscribe(collection => {
      console.log(collection);
      
      this.list = collection;
    });
    let parentCollection = this.appService.db.collection(this.parentCollection);
    parentCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => { //better way
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    ).subscribe(collection => {
      console.log(collection);
      this.parentList = collection;
    });

  }

  push() {

    this.appService.db.collection(this.collection).add({...this.columnField1[this.columnName1]}).then(() => {
      this.columnField1 = '';

    })
  }

}
