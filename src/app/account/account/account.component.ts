import { Component, OnInit } from '@angular/core';
import { AccountService, User, Team } from '../account.service';
import { AngularFireStorage } from 'angularfire2/storage';
import { map, finalize } from 'rxjs/operators';
import { AngularFireAuth } from 'angularfire2/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class ProfileComponent implements OnInit {

  showCompany: boolean = false;

  constructor(
    public accountService: AccountService,
    private storage: AngularFireStorage,
    public auth: AngularFireAuth,
    public router: Router
  ) { }

  ngOnInit() {
    this.accountService.helper = this.accountService.helperProfiles.account;
    if (this.accountService.aTeam.ownerId == this.accountService.user.id) {
      this.showCompany = true;
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
    this.auth.auth.signOut().then(() => {
      this.router.navigate(['home']);
    })
  }

}
