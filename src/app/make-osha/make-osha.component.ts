import { Component, OnInit, Pipe } from '@angular/core';
import { AppService } from '../app.service';
import { map } from "rxjs/operators";
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { DomSanitizer, SafeHtml, SafeStyle, SafeUrl, SafeScript, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-make-osha',
  templateUrl: './make-osha.component.html',
  styleUrls: ['./make-osha.component.css']
})
export class MakeOSHAComponent implements OnInit {

 
  collection: string = 'osha-manual-en';
  list;
  listId;

  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '50rem',
    minHeight: '25rem',
    placeholder: 'content',
    translate: 'yes',
  }

  newDoc: NewDoc = new NewDoc();


  constructor(
    public appService: AppService
  ) { }

  ngOnInit() {
    this.get();
  }

  get() {
    let collection = this.appService.db.collection(this.collection, ref => ref.orderBy("subject", "asc"));
    collection.snapshotChanges().pipe(
      map(actions => actions.map(a => { //better way
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    ).subscribe(collection => {
      this.list = collection;
    });
  }

  push() {
    this.appService.db.collection(this.collection).add({...this.newDoc}).then(() => {
      this.newDoc = new NewDoc();
    })
  }

}


export class NewDoc {
  subject: string;
  content: any;
}

@Pipe({name: 'safeHtml'})
export class Safe {
  constructor(protected _sanitizer: DomSanitizer) {}

	public transform(value: string, type: string = 'html'): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl {
		switch (type) {
			case 'html': return this._sanitizer.bypassSecurityTrustHtml(value);
			case 'style': return this._sanitizer.bypassSecurityTrustStyle(value);
			case 'script': return this._sanitizer.bypassSecurityTrustScript(value);
			case 'url': return this._sanitizer.bypassSecurityTrustUrl(value);
			case 'resourceUrl': return this._sanitizer.bypassSecurityTrustResourceUrl(value);
			default: throw new Error(`Invalid safe type specified: ${type}`);
		}
	}
}