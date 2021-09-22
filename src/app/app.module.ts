import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { NbAccordionModule, NbAlertModule, NbButtonGroupModule, NbButtonModule, NbCardModule, NbDialogModule, NbIconModule, NbLayoutModule, NbProgressBarModule, NbSpinnerModule, NbThemeModule } from '@nebular/theme';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { LottieModule } from 'ngx-lottie';
import player, { LottiePlayer } from 'lottie-web';
import { CompareComponent } from './compare/compare.component';
import { HomeComponent } from './home/home.component';
import { PhotoModalComponent } from './photo-modal/photo-modal.component';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { ReferencePhotoFormComponent } from './reference-photo-form/reference-photo-form.component';
import { FaceMatcherComponent } from './face-matcher/face-matcher.component';

@NgModule({
  declarations: [
    AppComponent,
    CompareComponent,
    HomeComponent,
    PhotoModalComponent,
    ReferencePhotoFormComponent,
    FaceMatcherComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    NbThemeModule.forRoot({ name: 'dark' }),
    NbLayoutModule,
    AppRoutingModule,
    NbCardModule,
    LottieModule.forRoot({ player: () => player }),
    NbSpinnerModule,
    NbButtonModule,
    NbIconModule,
    NbEvaIconsModule,
    NbDialogModule.forRoot(),
    NbAlertModule,
    NbProgressBarModule,
    NbButtonGroupModule,
    NbAccordionModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
