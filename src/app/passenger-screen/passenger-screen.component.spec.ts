import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassengerScreenComponent } from './passenger-screen.component';

describe('PassengerScreenComponent', () => {
  let component: PassengerScreenComponent;
  let fixture: ComponentFixture<PassengerScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerScreenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassengerScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
