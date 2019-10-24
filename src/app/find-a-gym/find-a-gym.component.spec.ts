import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FindAGymComponent } from "./find-a-gym.component";

describe("FindAGymComponent", () => {
  let component: FindAGymComponent;
  let fixture: ComponentFixture<FindAGymComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FindAGymComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FindAGymComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
