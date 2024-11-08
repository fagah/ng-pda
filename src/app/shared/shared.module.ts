import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCamera, faMicrophone, faMicrophoneAltSlash, faMicrophoneSlash, faPhoneSlash, faTimesCircle, faVideoCamera, faVideoSlash } from '@fortawesome/free-solid-svg-icons';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { CallDialogComponent } from './call-dialog/call-dialog.component';

@NgModule({
  declarations: [
    CallDialogComponent
  ],
  imports: [
    CommonModule,
    FontAwesomeModule
  ],
  exports: [
    CommonModule,
    FontAwesomeModule,
    NgbModalModule,
    ReactiveFormsModule
  ]
})
export class SharedModule {

  constructor(library: FaIconLibrary) {
    library.addIcons(faCamera, faVideoCamera, faTimesCircle, faVideoSlash, faMicrophone, faMicrophoneSlash, faMicrophoneAltSlash, faPhoneSlash);
  }
 }
