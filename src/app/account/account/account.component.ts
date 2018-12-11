import { Component, OnInit , Inject, ViewChild, ElementRef, ChangeDetectorRef} from '@angular/core';
import { AccountService, User, Team } from '../account.service';
import { AngularFireStorage } from '@angular/fire/storage';
import { map, finalize } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { environment } from 'src/environments/environment';
import { MatDialog, MatSnackBar, MatDialogRef } from '@angular/material';
import { MakePaymentComponent } from './payments/make-payment/make-payment.component';
declare var Stripe: Function;
declare var elements: any;

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class ProfileComponent implements OnInit {
  showCompany: boolean = false;
  teamTier: number;
  loading: boolean = false;

  constructor(
    public accountService: AccountService,
    private storage: AngularFireStorage,
    public auth: AngularFireAuth,
    public router: Router,
    public dialog: MatDialog
  ) { }


  ngOnInit() {
    this.accountService.teamUsersObservable.subscribe(team => {
      if (team) {
        this.getTierInfo();
        this.accountService.helper = this.accountService.helperProfiles.account;
        if (this.accountService.aTeam.ownerId == this.accountService.user.id) {
          this.showCompany = true;
        }
      }
    })
  }

  enterCardInfo() {
    let dialog = this.dialog.open(MakePaymentComponent, {
      disableClose: true
    });
  }

  getTierInfo() {
    if (this.accountService.teamUsers.length <=10) {
      this.teamTier = 39;
    } else if (11 < this.accountService.teamUsers.length && this.accountService.teamUsers.length <= 100) {
      this.teamTier = 99;
    } else {
      this.teamTier = this.accountService.teamUsers.length * 2;
    }
  }

  upload(profile): void { // this will call the file input from our custom button
    profile ?
    document.getElementById('upProfileUrl').click() :
    document.getElementById('upLogoUrl').click();
  }

  uploadProfileImage(event) {
    this.loading = true;
    let file = event.target.files[0];
    let filePath = this.accountService.user.id + '/' + "profile-image";
    let ref = this.storage.ref(filePath);
    let task = this.storage.upload(filePath, file);
    task.snapshotChanges().pipe(
      finalize(() => {
        ref.getDownloadURL().subscribe(url => {
          this.accountService.db.collection("user").doc<User>(this.accountService.user.id).update({profileUrl: url}).then(() => this.loading = false);
        });
      })
    ).subscribe();
  }

  uploadLogoImage(event) {
    this.loading = true;
    let file = event.target.files[0];
    let filePath = this.accountService.aTeam.id + '/' + "logo-image";
    let ref = this.storage.ref(filePath);
    let task = this.storage.upload(filePath, file);
    task.snapshotChanges().pipe(
      finalize(() => {
        ref.getDownloadURL().subscribe(url => {
          this.accountService.db.collection("team").doc<Team>(this.accountService.aTeam.id).update({logoUrl: url}).then(() => this.loading = false);
        });
      })
    ).subscribe();
  }

  saveProfile() {
    this.accountService.db.collection("user").doc(this.accountService.user.id).update({...this.accountService.user});
  }

  saveTeam() {
    this.accountService.db.collection("team").doc(this.accountService.aTeam.id).update({...this.accountService.aTeam});
  }

  deleteAccount() {
    let dialog = this.dialog.open(DeleteAccountDialog);
    dialog.afterClosed().subscribe(shouldDelete => {
      if (shouldDelete) { // disable the team
        let date = new Date();
        this.accountService.db.collection("support").add({
          createdAt: date,
          email: "internal",
          body: `${this.accountService.aTeam.name} has been deleted on ${date}. ${this.accountService.user.name} can be reached at ${this.accountService.user.phone} 
          or ${this.accountService.user.email}. Pause the Stripe account for teamId ${this.accountService.aTeam.id}.`
        });
        this.accountService.db.collection("team").doc(this.accountService.aTeam.id).update({
          disabled: true,
          disabledAt: date
        }).then(() => {
          window.location.reload(); // easiest way to repull the data
        }).catch(error => console.error("cannot delete account at this time, contact us for more help. " + error));
      }
    });
  } 
}


@Component({
  selector: "app-map-dialog",
  template: `
  <h2 mat-dialog-title>Are you sure?</h2>
  <mat-dialog-content>By clicking DELETE, you are removing access and making your account inactive.<br>
  We'll hold your data for 30 days, and then it will be purged from our system.</mat-dialog-content>
  <mat-dialog-actions style="margin-top:12px" align="end"><button mat-button color="primary" style="margin-right:8px" (click)="close(false)">CANCEL</button>
  <button mat-raised-button color="warn" (click)="close(true)">DELETE</button>
  </mat-dialog-actions>
  `
})
export class DeleteAccountDialog {
  constructor(
    public dialogRef: MatDialogRef<DeleteAccountDialog>
  ) {}

  close(shouldDelete) {
    this.dialogRef.close(shouldDelete);
  }
}