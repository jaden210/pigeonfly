import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { AngularFirestore } from "angularfire2/firestore";
import { AngularFireStorage } from "angularfire2/storage";
import { catchError, flatMap, takeLast, map, take } from "rxjs/operators";
import { TrainingService, Topic } from "../training.service";

@Injectable({
  providedIn: "root"
})
export class TopicsService {
  constructor(
    public db: AngularFirestore,
    private storage: AngularFireStorage,
    private trainingService: TrainingService
  ) {}

  public createTopic(topic: Topic): Promise<Topic> {
    return this.db
      .collection("topic")
      .add({ ...topic })
      .then(document => {
        topic.id = document.id;
        return topic;
      })
      .catch(error => {
        console.error(`Error creating topic ${topic.name}`, topic, error);
        throw error;
      });
  }

  public editTopic(topic): Promise<Topic> {
    const id = topic.id;
    delete topic.id;
    return this.db
      .collection("topic")
      .doc(id)
      .update({ ...topic })
      .then(() => topic)
      .catch(error => {
        console.error(`Error updating topic ${topic.name}`, topic, error);
        throw error;
      });
  }

  public deleteTopic(topic): Promise<void> {
    return this.db
      .collection("topic")
      .doc(topic.id)
      .delete()
      .catch(error => {
        console.error(`Error deleting topic ${topic.name}`, topic, error);
        throw error;
      });
  }

  public uploadImage(image): Observable<string> {
    let filePath = `topicImages`;
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
    this.storage.storage.refFromURL(imageUrl).delete();
  }
}
