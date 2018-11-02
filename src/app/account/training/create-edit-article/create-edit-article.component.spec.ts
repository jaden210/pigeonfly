import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CreateEditArticleComponent } from "./create-edit-article.component";

describe("CreateArticleComponent", () => {
  let component: CreateEditArticleComponent;
  let fixture: ComponentFixture<CreateEditArticleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateEditArticleComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEditArticleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
