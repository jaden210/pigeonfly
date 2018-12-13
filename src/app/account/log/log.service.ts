import { Injectable } from "@angular/core";
import { of, Observable, throwError } from "rxjs";
import { map, catchError, takeLast, flatMap, take } from "rxjs/operators";
import { AccountService } from "../account.service";

@Injectable()
export class LogService {
  constructor(private accountService: AccountService) {}

  public getLogs(teamId, limit): Observable<any> {
    return this.accountService.db
      .collection(`team/${teamId}/log`, ref =>
        ref.orderBy("createdAt", "desc").limit(limit)
      )
      .snapshotChanges()
      .pipe(
        map(actions =>
          actions.map(a => {
            const data = <any>a.payload.doc.data();
            const createdAt = data.createdAt.toDate();
            const id = a.payload.doc.id;
            return <Log>{ ...data, createdAt, id };
          })
        ),
        catchError(error => {
          console.error(error);
          return of([]);
        })
      );
  }

  public getAllLogs(teamId): Observable<any> {
    return this.accountService.db
      .collection(`team/${teamId}/log`, ref => ref.orderBy("createdAt", "desc"))
      .snapshotChanges()
      .pipe(
        take(1),
        map(actions => {
          return actions.map(a => {
            let data: any = a.payload.doc.data();
            return <Log>{
              ...data,
              id: a.payload.doc.id,
              createdAt: data.createdAt.toDate()
            };
          });
        })
      );
  }

  public generateLogId(teamId): string {
    return this.accountService.db.collection(`team/${teamId}/log`).ref.doc().id;
  }

  public createLog(log: Log, teamId): Promise<any> {
    let id = log.id;
    let logC = { ...log };
    delete logC.id;
    Object.keys(logC).forEach(key => {
      if (!logC[key]) delete logC[key];
    });
    return this.accountService.db
      .collection(`team/${teamId}/log`)
      .doc(id)
      .set(logC)
      .catch(error => {
        console.error("Error creating log", error);
        throw error;
      });
  }

  public uploadImage(image, teamId): Observable<string> {
    const date = new Date().getTime();
    let filePath = `${teamId}/logImages/${date}`;
    let ref = this.accountService.storage.ref(filePath);
    let task = this.accountService.storage.upload(filePath, image);
    return task.snapshotChanges().pipe(
      takeLast(1),
      flatMap(() => ref.getDownloadURL()),
      catchError(error => {
        console.error(`Error saving image for topic`, error);
        return throwError(error);
      })
    );
  }

  public updateLog(log, teamId): Promise<void> {
    let id = log.id;
    let logC = { ...log };
    delete logC.id;
    Object.keys(logC).forEach(key => {
      if (!logC[key]) delete logC[key];
    });
    return this.accountService.db
      .collection(`team/${teamId}/log`)
      .doc(id)
      .update(logC)
      .catch(error => {
        console.error("Error updating log", error);
        throw error;
      });
  }

  public deleteLog(logId, teamId): Promise<void> {
    return this.accountService.db
      .collection(`team/${teamId}/log`)
      .doc(logId)
      .delete()
      .catch(e => {
        console.error("Error deleting log.", e);
        throw e;
      });
  }

  /* Removes image from storage if log is deleted */
  public removeImage(imageUrl): void {
    this.accountService.storage.storage
      .refFromURL(imageUrl)
      .delete()
      .catch(e => console.error("Error removing image.", e));
  }
}

export class Log {
  id: string;
  createdAt: Date;
  userId: string;
  description: string;
  images: any[];
  LatPos: number;
  LongPos: number;
}
