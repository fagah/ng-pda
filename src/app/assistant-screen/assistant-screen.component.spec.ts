import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantScreenComponent } from './assistant-screen.component';

describe('AssistantScreenComponent', () => {
  let component: AssistantScreenComponent;
  let fixture: ComponentFixture<AssistantScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantScreenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssistantScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
