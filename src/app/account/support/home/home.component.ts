import { Component } from '@angular/core';
import { SupportService } from '../support.service';

@Component({
  selector: 'support-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  constructor(public supportService: SupportService) { }

}
