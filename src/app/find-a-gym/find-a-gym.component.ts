import { Component, ChangeDetectorRef } from '@angular/core';
import { AppService } from '../app.service';
import { GoogleMapsAPIWrapper } from '@agm/core';
import { Observable } from 'rxjs';
import { Gym } from '../account/account.service';

@Component({
  templateUrl: './find-a-gym.component.html',
  styleUrls: ['./find-a-gym.component.css'],
  providers: [GoogleMapsAPIWrapper]
})
export class FindAGymComponent {

  gyms: Gym[];
  aGym: Gym = null;
  searchParams = new Map();
  map;
  userLocation;
  loading: boolean = true;

  constructor(
    private appService: AppService,
    public agm: GoogleMapsAPIWrapper,
    private ref: ChangeDetectorRef
  ) {
    this.loading = true;
    navigator.geolocation.getCurrentPosition((position) => {
      this.userLocation = position.coords;
      this.updateMap(position.coords);
    }, error => {
      let position = {latitude: 37.17582, longitude: -113.5014213};    
      this.updateMap(position);
    });
    this.appService.getGymLocations().subscribe(gyms => {
      this.gyms = gyms;
    });
  }

  searchByZip(search) {
    if (search.length) {
      this.appService.geocodeLocation(search).subscribe(coords => {
        this.updateMap(coords);
      });
    } else this.updateMap(this.userLocation);
  }

  updateMap(coords) {
    this.searchParams.lat = coords.latitude;
    this.searchParams.long = coords.longitude;
    this.searchParams.zoom = 13;
    this.ref.detectChanges();
    this.loading = false;
  }

  getDirections() {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${this.aGym.latitude},${this.aGym.longitude}`, '_blank');
  }
}

export class Map {
  lat: number;
  long: number;
  zoom: number;
}