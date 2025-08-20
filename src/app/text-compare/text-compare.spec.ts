import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextCompare } from './text-compare';

describe('TextCompare', () => {
  let component: TextCompare;
  let fixture: ComponentFixture<TextCompare>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextCompare]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextCompare);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
