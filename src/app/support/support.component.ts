import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent implements OnInit {

  support: Support = new Support();
  submitted: boolean = false;

  constructor(public appService: AppService) { }

  ngOnInit() {
  }

  submit() {
    this.support.createdAt = new Date();
    this.appService.db.collection("support").add({...this.support}).then(() => {
      this.submitted = true;
      this.support = new Support();
    });
  }

}


export class Support {
  email: string;
  body: string;
  createdAt: Date;
}