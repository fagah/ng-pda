import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CallDialogComponent } from './call-dialog.component';

describe('CallDialogComponent', () => {
  let component: CallDialogComponent;
  let fixture: ComponentFixture<CallDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CallDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CallDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
