import { Component, OnInit, Inject } from '@angular/core';
import { AccountService, InviteToTeam } from '../account.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})
export class TeamComponent implements OnInit {

  invitedUsers: InviteToTeam[];

  constructor(
    public accountService: AccountService,
    public dialog: MatDialog
  ) {
    this.accountService.helper = this.accountService.helperProfiles.newTeam;
    let invitedCollection = this.accountService.db.collection<InviteToTeam[]>("invitation", ref => ref.where("status", "==", "invited"));
    invitedCollection.snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          let data:any = a.payload.doc.data();
          return <InviteToTeam>{
            ...data,
            id: a.payload.doc.id,
          };
        });
      })
    ).subscribe(invitedUsers => {
      this.invitedUsers = invitedUsers;
    });
   }

  ngOnInit() {
    this.accountService.helper = this.accountService.helperProfiles.team;
  }

  inviteToTeam() {
    let dialog = this.dialog.open(InviteDialog, {
      data: new InviteToTeam(),
      disableClose: true
    });
    dialog.afterClosed().subscribe((data: InviteToTeam) => {
      if (data) {
        data.companyName = this.accountService.aTeam.name;
        data.teamId = this.accountService.aTeam.id;
        this.accountService.db.collection("invitation").add({... data})
      }
    });
  }

  resendEmail() {

  }

  deleteInvite(user) {
    this.accountService.db.collection("invitation").doc(user.id).delete();
  }
}

@Component({
  selector: 'invite-dialog',
  templateUrl: 'invite-dialog.html',
  styleUrls: ['./team.component.css']
})
export class InviteDialog {

  constructor(
    public dialogRef: MatDialogRef<InviteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: InviteToTeam) {}

  close(): void {
    this.dialogRef.close();
  }

}