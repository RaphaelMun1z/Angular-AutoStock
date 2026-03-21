import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleView } from './vehicle-view';

describe('VehicleView', () => {
  let component: VehicleView;
  let fixture: ComponentFixture<VehicleView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
