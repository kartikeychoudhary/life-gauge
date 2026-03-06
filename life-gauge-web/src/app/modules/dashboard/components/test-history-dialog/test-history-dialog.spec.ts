import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestHistoryDialog } from './test-history-dialog';

describe('TestHistoryDialog', () => {
  let component: TestHistoryDialog;
  let fixture: ComponentFixture<TestHistoryDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestHistoryDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestHistoryDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
