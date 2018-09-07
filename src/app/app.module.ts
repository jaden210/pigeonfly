import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { NgModule } from "@angular/core";
import { AngularFireModule } from "angularfire2";
import { AngularFirestoreModule } from "angularfire2/firestore";
import { AngularFireStorageModule } from "angularfire2/storage";
import { AngularFireAuthModule } from "angularfire2/auth";
import { environment } from "../environments/environment";

import { AppComponent } from "./app.component";
import { MaterialModule } from "./material/material.module";
import { AppRoutingModule } from "./app-routing.module";
import { HomeComponent } from "./home/home.component";
import { WhyComponent } from "./why/why.component";
import { PricingComponent } from "./pricing/pricing.component";
import { AboutComponent } from "./about/about.component";
import { ContactComponent } from "./contact/contact.component";
import { LoginComponent } from "./login/login.component";
import { FormsModule } from "@angular/forms";
import { MakeOSHAComponent, Safe } from "./make-osha/make-osha.component";
import { AngularEditorModule } from "@kolkov/angular-editor";
import { HttpClientModule } from "@angular/common/http";
import { FooterComponent } from "./footer/footer.component";
import { AssesComponent } from "./ases/make-osha.component";
import { PreviewDialogComponent } from "./make-osha/preview-dialog/preview-dialog.component";

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    WhyComponent,
    PricingComponent,
    AboutComponent,
    ContactComponent,
    LoginComponent,
    MakeOSHAComponent,
    AssesComponent,
    Safe,
    FooterComponent,
    PreviewDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AngularFireStorageModule,
    AngularFirestoreModule,
    FormsModule,
    AngularEditorModule,
    HttpClientModule
  ],
  entryComponents: [PreviewDialogComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
