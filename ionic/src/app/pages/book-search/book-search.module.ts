import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BookSearchPageRoutingModule } from './book-search-routing.module';

import { BookSearchPage } from './book-search.page';
import { ComponentModule } from 'src/app/components/component.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BookSearchPageRoutingModule,
    ComponentModule,
    TranslateModule
  ],
  declarations: [BookSearchPage]
})
export class BookSearchPageModule {}
