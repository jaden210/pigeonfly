import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssesmentComponent } from './assesment.component';
import { ToolbarHelperComponent } from '../toolbar-helper/toolbar-helper.component';
import { MatToolbarModule, MatListModule, MatFormFieldModule, MatIconModule, MatExpansionModule, MatCheckboxModule, MatRadioModule, MatDialogModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';

describe('AssesmentComponent', () => {
  let component: AssesmentComponent;
  let fixture: ComponentFixture<AssesmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssesmentComponent, ToolbarHelperComponent ],
      providers: [
        { provide: AngularFireAuth, useValue: FirestoreStub },
        { provide: AngularFirestore, useValue: FirestoreStub },
        { provide: AngularFireStorage, useValue: FirestoreStub },
      ],
      imports: [
        MatToolbarModule,
        MatListModule,
        FormsModule,
        MatFormFieldModule,
        MatIconModule,
        MatExpansionModule,
        MatCheckboxModule,
        MatRadioModule,
        MatDialogModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssesmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

const FirestoreStub = {
  collection: (name: string) => ({
    doc: (_id: string) => ({
      valueChanges: () => new BehaviorSubject({ foo: 'bar' }),
      set: (_d: any) => new Promise((resolve, _reject) => resolve()),
    }),
  }),
}