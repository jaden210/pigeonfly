import { NgModule, ModuleWithProviders } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ToolbarHelperComponent } from "./account/toolbar-helper/toolbar-helper.component";
import { MaterialModule } from "./material/material.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MaterialModule
  ],
  declarations: [ToolbarHelperComponent],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ToolbarHelperComponent,
    MaterialModule
  ],
  entryComponents: [],
  providers: []
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: []
    };
  }
}
