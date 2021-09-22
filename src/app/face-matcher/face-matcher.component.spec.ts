import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaceMatcherComponent } from './face-matcher.component';

describe('FaceMatcherComponent', () => {
  let component: FaceMatcherComponent;
  let fixture: ComponentFixture<FaceMatcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FaceMatcherComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FaceMatcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
