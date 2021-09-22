import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NbDialogService } from '@nebular/theme';
import { timer } from 'rxjs';
import { PhotoModalComponent } from '../photo-modal/photo-modal.component';
import { BiometricAuthService } from '../util/biometric-auth.service';

@Component({
  selector: 'app-reference-photo-form',
  templateUrl: './reference-photo-form.component.html',
  styleUrls: ['./reference-photo-form.component.scss']
})
export class ReferencePhotoFormComponent implements OnInit {

  image1!: string;

  closeness = 0;
  @ViewChild('image') imageElement1: any;

  constructor(
    private dialogService: NbDialogService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private auth: BiometricAuthService
  ) { }

  ngOnInit(): void {
  }

  async setPhoto() {
    const photo = await this.dialogService.open(PhotoModalComponent)
      .onClose.toPromise();

    if (!photo) return;

    this.image1 = photo;
    await this.auth.setReferenceImage(this.image1);

    await timer(1000).toPromise();
    this.router.navigateByUrl('/face-matcher')
    this.cd.detectChanges();

  }

}
