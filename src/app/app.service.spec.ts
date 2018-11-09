import { TestBed, inject } from '@angular/core/testing';

import { AppService } from './app.service';
import { BehaviorSubject } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';

describe('AppService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppService, 
        { provide: AngularFirestore, useValue: FirestoreStub },
      ]
    });
  });

  it('should be created', inject([AppService], (service: AppService) => {
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
