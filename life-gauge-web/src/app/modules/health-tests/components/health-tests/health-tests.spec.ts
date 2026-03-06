import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthTests } from './health-tests';

describe('HealthTests', () => {
  let component: HealthTests;
  let fixture: ComponentFixture<HealthTests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HealthTests]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HealthTests);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
