import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';

@Component({
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {
  
  order: Order = new Order();
  room: Room = new Room();
  roomTypes = [
    "test","test2"
  ];
  components = [
    {name: "coat", asset: "/assets/components/coat.png"},
    {name: "linen", asset: "/assets/components/linen.png"},
    {name: "high-low/organizer", asset: "/assets/components/hlo.png"},
    {name: "high-low/organizer/high", asset: "/assets/components/hloh.png"},
    {name: "high-low/organizer/high-low", asset: "/assets/components/hlohl.png"},
    {name: "high/organizer", asset: "/assets/components/ho.png"},
    {name: "high/organizer/high", asset: "/assets/components/hoh.png"},
    {name: "high/organizer/high-low", asset: "/assets/components/hohl.png"},
    {name: "organizer/high", asset: "/assets/components/oh.png"},
    {name: "organizer/high-low", asset: "/assets/components/ohl.png"}
  ]

  colors = ["white", "textured gray"];

  depths = [12,14,16];

  constructor(public appService: AppService){}

  addRoom() {
    let room = new Room();
    let newWall = new Wall();
    room.walls.push(newWall);
    this.order.rooms.push(room);
    this.room = room;
  }

  addWall() {
    let newWall = new Wall();
    this.room.walls.push(newWall);
  }

  selectRoom(room) {
    this.room = room;
  }

  reset() {
    this.order = new Order();
    this.order.rooms = [];
    this.room = new Room();
    this.addRoom();
  }

  ngOnInit() {
    this.addRoom();
  }

  submit() {
    console.log(Object.assign({}, this.order));
    this.appService.db.collection("closets").add(Object.assign({},this.order)).then(() => {
      this.reset();
    })
  }

}

export class Order {
  name: any;
  createdAt: any;
  shipDate: any;
  rooms: Room[] = [];
  contactName: any;
  contactPhone: any;
}

export class Room {
  name: any;
  roomType: any;
  walls: Wall[] = [];
  color: any;
}

export class Wall {
  width: number;
  depth: number = 16;
  component: any;
}