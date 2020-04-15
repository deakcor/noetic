import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { FirebaseService } from 'src/app/services/firebase.service';

@Component({
  selector: 'app-settings-book',
  templateUrl: './settings-book.page.html',
  styleUrls: ['./settings-book.page.scss'],
})
export class SettingsBookPage implements OnInit {

  constructor(public alertController: AlertController, public firebase: FirebaseService) {}

  ngOnInit() {
  }

  async alertDelete() {
    const alert = await this.alertController.create({
      header: 'Delete the book',
      message: 'Are you sure to delete the book?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: 'Confirm',
          handler: () => {
            this.firebase.deleteBook();
          }
        }
      ]
    });
    await alert.present();
  }

  async alertPublish() {
    const alert = await this.alertController.create({
      header: 'Publier le livre',
      message: 'Etes vous sûr de rendre ce livre publique?',
      buttons: [
        {
          text: 'Non',
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: 'Oui',
          handler: () => {
            this.firebase.publishBook();
          }
        }
      ]
    });
    await alert.present();
  }

  delete() {
    this.alertDelete();
  }

  publish() {
    this.alertPublish();
  }
}
