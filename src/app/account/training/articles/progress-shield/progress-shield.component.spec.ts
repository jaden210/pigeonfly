import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressShieldComponent } from './progress-shield.component';

describe('ProgressShieldComponent', () => {
  let component: ProgressShieldComponent;
  let fixture: ComponentFixture<ProgressShieldComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProgressShieldComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressShieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
