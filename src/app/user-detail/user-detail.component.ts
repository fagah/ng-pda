import { Component } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [SharedModule, CommonModule],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
})
export class UserDetailComponent {
  userDetail: any;
  stationGroups = [{id: 'passenger', name: 'Passenger'}, {id:'agent', name: 'Agent'}];
  userDetailForm!: FormGroup;

  constructor(public activeModal: NgbActiveModal, private fb: FormBuilder) {
    this.userDetailForm = this.fb.group({
      stationId: ['', Validators.required],
      stationGroup: ['', [Validators.required]]
    });
  }

  updateForm(userDetail: any) {
    this.userDetail = userDetail;
    this.userDetailForm.patchValue({
      stationId: userDetail.stationId,
      stationGroup: userDetail.stationGroup
    });
  }

  cancel() {
    this.activeModal.dismiss();
  }

  save() {
      this.activeModal.close(this.userDetailForm.value);
  }
}
