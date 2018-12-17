import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { AngularFireStorage } from "@angular/fire/storage";
import { catchError, flatMap, takeLast, map, take } from "rxjs/operators";
import { Topic } from "../training.service";

@Injectable({
  providedIn: "root"
})
export class TopicsService {
  constructor(
    public db: AngularFirestore,
    private storage: AngularFireStorage
  ) {}

  /* If the article is created by one of us, add to the article collection
  else add to team/article collection. This should also be favorited */
  public createTopic(topic: Topic, teamId, isGlobal): Promise<Topic> {
    const ref = isGlobal
      ? this.db.collection("topic")
      : this.db.collection(`team/${teamId}/topic`);
    const id = isGlobal ? ref.ref.doc().id : `${teamId}_${ref.ref.doc().id}`;
    let sTopic = { ...topic };
    delete sTopic.id;
    return ref
      .doc(id)
      .set(sTopic)
      .then(() => {
        topic.id = id;
        return topic;
      })
      .catch(error => {
        console.error(`Error creating topic ${topic.name}`, topic, error);
        throw error;
      });
  }

  public updateTopic(topic: Topic, teamId): Promise<any> {
    let top = { ...topic };
    const id = top.id;
    delete top.id;
    const ref = id.includes(teamId)
      ? this.db.collection(`team/${teamId}/topic`)
      : this.db.collection("topic");
    return ref
      .doc(topic.id)
      .update({ ...topic })
      .then(() => topic)
      .catch(error => {
        console.error(`Error updating topic ${topic.name}`, topic, error);
        alert(
          `Error updating article ${topic.name}, falling back to original.`
        );
      });
  }

  public deleteTopic(topic: Topic, teamId): Promise<any> {
    const ref = topic.id.includes(teamId)
      ? this.db.collection(`team/${teamId}/topic`)
      : this.db.collection("topic");
    return ref
      .doc(topic.id)
      .delete()
      .catch(error => {
        console.error(`Error deleting topic ${topic.name}`, topic, error);
        throw error;
      });
  }

  public uploadImage(image, teamId): Observable<string> {
    const date = new Date().getTime();
    let filePath = `${teamId}/topicImages/${date}`;
    let ref = this.storage.ref(filePath);
    let task = this.storage.upload(filePath, image);
    return task.snapshotChanges().pipe(
      takeLast(1),
      flatMap(() => ref.getDownloadURL()),
      catchError(error => {
        console.error(`Error saving image for topic`, error);
        return throwError(error);
      })
    );
  }

  public removeImage(imageUrl): void {
    this.storage.storage
      .refFromURL(imageUrl)
      .delete()
      .catch();
  }
}
