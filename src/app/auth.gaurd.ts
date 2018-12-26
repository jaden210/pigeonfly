import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from 
'@angular/router';
import {Router} from '@angular/router';
import { Observable } from 'rxjs';
import { take, map, tap } from 'rxjs/operators';

import { AngularFireAuth } from '@angular/fire/auth';
@Injectable({
    providedIn: "root"
  })
export class AuthGuard implements CanActivate {
  constructor(private auth: AngularFireAuth,
    private router: Router){
  }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      return this.auth.authState.pipe(
        take(1),
        map((authState) => !!authState),
        tap(authenticated => {
          if (!authenticated) this.router.navigate(['/sign-in'])
        })
      )
  }
}