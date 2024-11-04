import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCamera, faMicrophone, faMicrophoneAltSlash, faMicrophoneSlash, faPhoneSlash, faTimesCircle, faVideoCamera, faVideoSlash } from '@fortawesome/free-solid-svg-icons';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FontAwesomeModule
  ],
  exports: [
    FontAwesomeModule,
    NgbModalModule
  ]
})
export class SharedModule {

  constructor(library: FaIconLibrary) {
    library.addIcons(faCamera, faVideoCamera, faTimesCircle, faVideoSlash, faMicrophone, faMicrophoneSlash, faMicrophoneAltSlash, faPhoneSlash);
  }
 }
