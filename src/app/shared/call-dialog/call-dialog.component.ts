import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-call-dialog',
  templateUrl: './call-dialog.component.html',
  styleUrl: './call-dialog.component.scss'
})
export class CallDialogComponent {
  caller!: string; // Le nom du caller

  constructor(public activeModal: NgbActiveModal) {}

  accept() {
      this.activeModal.close('accept'); // Ferme la modale avec 'accept'
  }

  decline() {
      this.activeModal.close('decline'); // Ferme la modale avec 'decline'
  }
}
