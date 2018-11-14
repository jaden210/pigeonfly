import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AngularFirestore } from '@angular/fire/firestore';
import { AccountService } from 'src/app/account/account.service';
import { tokenKey } from '@angular/core/src/view';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-make-payment',
  templateUrl: './make-payment.component.html',
  styleUrls: ['./make-payment.component.css']
})
export class MakePaymentComponent implements AfterViewInit {
  @ViewChild('payElement') payElement;


  stripe: any;
  elements: any;
  card: any;
  isValid: boolean = false;

  constructor(private accountService: AccountService, public dialogRef: MatDialogRef<MakePaymentComponent>) { }

  ngAfterViewInit() {
    this.stripe = Stripe(environment.stripe.publishable);
    this.elements = this.stripe.elements()  
    // Create an instance of the card Element.
    this.card = this.elements.create('card');
    // Add an instance of the card Element into the `card-element` <div>.
    this.card.mount('#card-element');

    this.card.addEventListener('change', event => {
      var displayError = document.getElementById('card-errors');
      if (event.error) {
        displayError.textContent = event.error.message;
      } else {
        displayError.textContent = '';
      }
      this.isValid = event.complete;
    });
  }
  
  formSubmit() {
    event.preventDefault();
    this.stripe.createToken(this.card).then(result => {
      if (result.error) {
        // Inform the customer that there was an error.
        var errorElement = document.getElementById('card-errors');
        errorElement.textContent = result.error.message;
      } else {
        this.accountService.db.doc(`team/${this.accountService.aTeam.id}`).update({cardToken: result.token}).then(() => {
          this.dialogRef.close();
        }).catch(() => errorElement.textContent = "error saving card details, try again later.")
      }
    });
  }

  cancel() {
    this.dialogRef.close();
  }

}