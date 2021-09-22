import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferencePhotoFormComponent } from './reference-photo-form.component';

describe('ReferencePhotoFormComponent', () => {
  let component: ReferencePhotoFormComponent;
  let fixture: ComponentFixture<ReferencePhotoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReferencePhotoFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReferencePhotoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
