import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CompareComponent } from './compare/compare.component';
import { FaceMatcherComponent } from './face-matcher/face-matcher.component';
import { HomeComponent } from './home/home.component';
import { ReferencePhotoFormComponent } from './reference-photo-form/reference-photo-form.component';

const routes: Routes = [
    {
      path: '',
      component: HomeComponent
    },
    {
      path: 'set-reference',
      component: ReferencePhotoFormComponent
    },
    {
      path: 'face-matcher',
      component: FaceMatcherComponent
    },
    {
      path: 'compare',
      component: CompareComponent
    }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule,
  ]
})
export class AppRoutingModule { }
