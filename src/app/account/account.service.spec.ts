import { TestBed, inject } from '@angular/core/testing';

import { AccountService } from './account.service';
import { BehaviorSubject } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireStorage } from '@angular/fire/storage';
import { MatDialogModule } from '@angular/material';

describe('AccountService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AccountService,
        { provide: AngularFirestore, useValue: FirestoreStub },
        { provide: AngularFireAuth, useValue: FirestoreStub },
        { provide: AngularFireStorage, useValue: FirestoreStub },
      ],
      imports: [
        MatDialogModule
      ]
    });
  });

  it('should be created', inject([AccountService], (service: AccountService) => {
    expect(service).toBeTruthy();
  }));
});

const FirestoreStub = {
  collection: (name: string) => ({
    doc: (_id: string) => ({
      valueChanges: () => new BehaviorSubject({ foo: 'bar' }),
      set: (_d: any) => new Promise((resolve, _reject) => resolve()),
    }),
  }),
}
