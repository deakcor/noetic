import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NewBookPageRoutingModule } from './new-book-routing.module';

import { NewBookPage } from './new-book.page';
import { UploadComponent } from 'src/app/components/modals/upload/upload.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NewBookPageRoutingModule
  ],
  declarations: [NewBookPage],
  entryComponents: [UploadComponent]
})
export class NewBookPageModule {}
