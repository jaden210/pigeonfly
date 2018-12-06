import { Component, OnInit } from '@angular/core';
import { SupportService, Support } from '../support.service';

@Component({
  selector: 'web-support',
  templateUrl: './web-support.component.html',
  styleUrls: ['./web-support.component.css']
})
export class WebSupportComponent implements OnInit {

  supportItems: Support[];
  aItem: Support; // temp var

  constructor(public supportService: SupportService) { }

  ngOnInit() {
    this.supportService.getSupportItems().subscribe((supportItems: Support[]) => {
      this.supportItems = supportItems;
    });
  }

  expandItem(item) {
    this.aItem = item;
    this.supportService.getSupportItemUser(item.email).subscribe(users => {
      if (users[0]) {
        this.aItem.isUser = true;
        this.aItem.user = users[0];
      }
    });
  }

  markReplied() {
    this.supportService.setSupportReplied(this.aItem.id).then(() => {
      this.aItem = null;
    });
  }
}

