import { Component, OnInit } from '@angular/core';
import { AccountService } from '../../account.service';
import { Observable } from 'rxjs';
import { SupportService } from '../support.service';

@Component({
  selector: 'app-gyms',
  templateUrl: './gyms.component.html',
  styleUrls: ['./gyms.component.css']
})
export class GymsComponent implements OnInit {

  gyms: Observable<any>;

  constructor(
    public accountService: AccountService,
    public supportService: SupportService
  ) { }

  ngOnInit() {
    this.gyms = this.supportService.getGyms();
  }

  newGym() {
    this.supportService.makeGym = true;
  }

  editGym(gym) {
    this.supportService.makeGym = true;
    this.supportService.gym = gym;
  }

}