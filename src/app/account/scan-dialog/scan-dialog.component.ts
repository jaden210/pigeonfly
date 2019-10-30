import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';

import * as moment from "moment";

@Component({
  selector: 'scan-dialog',
  templateUrl: './scan-dialog.component.html',
  styleUrls: ['./scan-dialog.component.css']
})
export class ScanDialog {

  user;
  loading : boolean = false;
  searchString: string;
  errorMsg: string;
  useCamera: boolean = false;
  showCamera: boolean = false;

  constructor(public dialogRef: MatDialogRef<ScanDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public db: AngularFirestore,
    ) {
    }

    getUser() {
      this.loading = true;
      this.errorMsg = '';
      let parts = this.searchString.split('/');
      let id = parts.pop();
      this.db.doc(`user/${id}`).snapshotChanges().pipe(
        map((actions: any) => {
          let data = actions.payload.data() || {};
          data["id"] = actions.payload.id;
          return data;
        })
      ).subscribe(user => {
        if (!user.email) {
          this.errorMsg = "- no user found!";
        } else {
          this.user = user;
          this.checkLastVisit(user.id);
          this.showCamera = false;
        }
        this.loading = false;
      });
    }

    checkLastVisit(id) {
      this.db.collection(`visits`, ref => ref.where("userId", "==", this.user.id)).snapshotChanges().pipe(
        map(actions =>
          actions.map(a => {
            const data = a.payload.doc.data() as any;
            data['createdAt'] = data.createdAt.toDate();
            const id = a.payload.doc.id;
            return { ...data, id };
          })
        )
      ).subscribe(visits => {
        let localVisits = visits.filter(gym => gym.gymId == this.data.gym.id);
        this.user.lastVisit = moment(localVisits[0].createdAt, "YYYYMMDD").fromNow();
      });
      
    }

    admitUserToGym() {
      this.db.collection(`visits`).add({
        createdAt: new Date(),
        userId: this.user.id,
        userName: this.user.name,
        gymName : this.data.gym.name,
        gymId: this.data.gym.id //other stuff??
      }).then(() => {
        this.clearUser();
      });
    }

    viewUserAccount() {

    }

    clearUser() {
      this.user = null;
      this.searchString = '';
      this.useCamera ? this.showCamera = true : null;
    }

    close(submit) {
      this.dialogRef.close(submit);
    }

    toggleCamera() { // yeah yeah
      if (!this.useCamera) {
        this.useCamera = true;
        this.showCamera = true;
      } else {
        this.useCamera = false;
        this.showCamera = false;
      }
    }

    onCodeResult(event) {
      this.searchString = event;
      this.getUser();
    }

}