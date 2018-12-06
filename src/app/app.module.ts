import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { SharedModule } from "./shared-module";

import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AngularFireModule } from "@angular/fire";
import { AngularFirestoreModule } from "@angular/fire/firestore";
import { AngularFireStorageModule } from "@angular/fire/storage";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { environment } from "../environments/environment";
import { AngularEditorModule } from "@kolkov/angular-editor";
import { HttpClientModule } from "@angular/common/http";

import { AppComponent } from "./app.component";
import { MaterialModule } from "./material/material.module";
import { AppRoutingModule } from "./app-routing.module";
import { HomeComponent } from "./home/home.component";
import { SupportComponent } from "./support/support.component";
import { PricingComponent } from "./pricing/pricing.component";
import { AboutComponent } from "./about/about.component";
import { ContactComponent } from "./contact/contact.component";
import { LoginComponent } from "./login/login.component";
import { MakeOSHAComponent, Safe } from "./make-osha/make-osha.component";
import { FooterComponent } from "./footer/footer.component";
import { PreviewDialogComponent } from "./make-osha/preview-dialog/preview-dialog.component";
import { TopicDialogComponent } from "./make-osha/topic-dialog/topic-dialog.component";
import { SignUpComponent } from "./sign-up/sign-up.component";
import { HowComponent } from "./how/how.component";
import { TermsOfUseComponent } from "./terms-of-use/terms-of-use.component";
import { PrivacyPolicyComponent } from "./privacy-policy/privacy-policy.component";
import { CustomerAgreementComponent } from "./customer-agreement/customer-agreement.component";
import { VideoDialogComponent } from "./video-dialog/video-dialog.component";
import { TeamDisabledDialog } from "./account/account.service";

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SupportComponent,
    PricingComponent,
    AboutComponent,
    HowComponent,
    ContactComponent,
    LoginComponent,
    MakeOSHAComponent,
    Safe,
    FooterComponent,
    SignUpComponent,
    PreviewDialogComponent,
    TopicDialogComponent,
    TermsOfUseComponent,
    PrivacyPolicyComponent,
    CustomerAgreementComponent,
    VideoDialogComponent,
    TeamDisabledDialog
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
    HttpClientModule,
    SharedModule.forRoot()
  ],
  entryComponents: [
    PreviewDialogComponent,
    TopicDialogComponent,
    VideoDialogComponent,
    TeamDisabledDialog
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
