import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AngularFireModule } from '@angular/fire';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { ImageCropperModule } from 'ngx-image-cropper';
import { HttpClient } from '@angular/common/http';
import {TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import { FirebaseService } from './services/firebase.service';
import { UserService } from './services/user.service';
import { SlidesService } from './services/slides.service';

export const firebaseConfig = {
  apiKey: "AIzaSyDAZRFBAHjrS8Ww03U95mMhX1-AD9rPDGo",
  authDomain: "noetic-app.firebaseapp.com",
  databaseURL: "https://noetic-app.firebaseio.com",
  projectId: "noetic-app",
  storageBucket: "noetic-app.appspot.com",
  messagingSenderId: "467577218262",
  appId: "1:467577218262:web:2914bf26f35fdfaaf8d577",
  measurementId: "G-NLHMEK6CM5"
};

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    AngularFireStorageModule,
    AngularFirestoreModule,
    ImageCropperModule,
    TranslateModule.forRoot(),
  ],
  providers: [
    StatusBar,
    SplashScreen,
    FirebaseService,
    SlidesService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
