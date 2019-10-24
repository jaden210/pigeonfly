import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintComponent } from './print.component';
import { ToolbarHelperComponent } from '../toolbar-helper/toolbar-helper.component';
import { MatToolbarModule, MatFormFieldModule, MatTabsModule, MatIconModule, MatRadioModule, MatDialogModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';

describe('PrintComponent', () => {
  let component: PrintComponent;
  let fixture: ComponentFixture<PrintComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AngularFireAuth, useValue: FirestoreStub },
        { provide: AngularFirestore, useValue: FirestoreStub },
        { provide: AngularFireStorage, useValue: FirestoreStub },
      ],
      declarations: [ PrintComponent, ToolbarHelperComponent ],
      imports: [
        MatToolbarModule,
        FormsModule,
        MatFormFieldModule,
        MatTabsModule,
        MatIconModule,
        MatRadioModule,
        MatDialogModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrintComponent);
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