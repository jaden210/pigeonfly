import { Component, OnInit , Inject, ViewChild, ElementRef, ChangeDetectorRef} from '@angular/core';
import { AccountService, User, Team } from '../account.service';
import { AngularFireStorage } from '@angular/fire/storage';
import { map, finalize } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material';
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
  accountTypes;
  trialDaysLeft;
  teamTier: number;

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
          let accountTypesCollection = this.accountService.db.collection("osha-manual-en"); //thinking this will never be a large call, but check with nested collections to see later.
          accountTypesCollection.valueChanges().subscribe(accountTypes => {
            this.accountTypes = accountTypes;
          });
          this.trialDaysLeft = 30 - moment().diff(this.accountService.aTeam.createdAt, 'days');
          
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
    let file = event.target.files[0];
    let filePath = this.accountService.user.id + '/' + "profile-image";
    let ref = this.storage.ref(filePath);
    let task = this.storage.upload(filePath, file);
    task.snapshotChanges().pipe(
      finalize(() => {
        ref.getDownloadURL().subscribe(url => {
          this.accountService.db.collection("user").doc<User>(this.accountService.user.id).update({profileUrl: url});
        });
      })
    ).subscribe();
  }

  uploadLogoImage(event) {
    let file = event.target.files[0];
    let filePath = this.accountService.aTeam.id + '/' + "logo-image";
    let ref = this.storage.ref(filePath);
    let task = this.storage.upload(filePath, file);
    task.snapshotChanges().pipe(
      finalize(() => {
        ref.getDownloadURL().subscribe(url => {
          this.accountService.db.collection("team").doc<Team>(this.accountService.aTeam.id).update({logoUrl: url});
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

  logout() {
    localStorage.removeItem('teamId');
    this.auth.auth.signOut().then(() => {
      this.router.navigate(['home']);
    })
  }

  helper(profile) {
    this.accountService.helper = this.accountService.helperProfiles[profile];
    this.accountService.showHelper = true;
  }
  
}
