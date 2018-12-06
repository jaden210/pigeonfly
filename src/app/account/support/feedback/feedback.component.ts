import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { SupportService } from '../support.service';

@Component({
  selector: 'feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent implements OnInit {

  feedbackItems: Observable<any>;

  constructor(public supportService: SupportService) { }

  ngOnInit() {
    this.feedbackItems = this.supportService.getFeedbackItems();
  }
  
  close(item) {
    this.supportService.setFeedbackClosed(item.id).then(() => {
    });
  }

  email(item) {
    var subject = "Compliancechimp Feedback Team";
    var emailBody =
      "After looking into your feedback.....";
    window.open("mailto:" + item.email + "?subject=" + subject + "&body=" + emailBody, "_blank");
  }
}