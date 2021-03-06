import { Injectable } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subscription, Observable } from 'rxjs';
import { BookService } from '../book.service';
import { PopupService } from '../popup.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  curChatId: string;
  chatLogsSub: Subscription;
  chat: any = {};
  chatLogs: any[] = [];

  constructor(
    private navCtrl: NavController,
    private bookService: BookService,
    private firestore: AngularFirestore,
    private popupService: PopupService,
    private alertController: AlertController
  ) { }

  syncChat(chatId) {
    this.curChatId = chatId;
    this.chatLogsSub = this.firestore.collection('books').doc(this.bookService.curBookId)
                                     .collection('chats').doc(chatId).valueChanges().subscribe((value: any) => {
      if (value !== undefined) {
        this.chat = value;
        this.chatLogs = value.logs;
      } else {
        this.chatLogsSub.unsubscribe();
      }
    });
  }

  unsyncChat() {
    this.chatLogsSub.unsubscribe();
  }

  editChatLog(log, index = this.chatLogs.length) {
    const res = this.chatLogs;
    res.splice(index, 1, log);
    this.setChatLogs(res);
  }

  addChatLog(log, index = this.chatLogs.length) {
    if (log.msg.length > 800) {
      this.popupService.alert('Impossible d\'envoyer plus de 800 caractères.');
      return;
    }
    if (this.chatLogs.length > 1000) {
      this.popupService.alert(
        'Impossible d\'envoyer plus de 1000 messages dans un chat.' +
        ' Vous pouvez en créer un autre et y rediriger le lecteur en entrant la commande "/go -chat NOM_DU_CHAT"'
        );
      return;
    }
    const res = this.chatLogs;
    res.splice(index, 0, log);
    this.setChatLogs(res);
  }

  deleteChatLog(index = this.chatLogs.length) {
    const res = this.chatLogs;
    res.splice(index, 1);
    this.setChatLogs(res);
  }

  deleteChat(chatId = this.curChatId) {
    if (chatId !== 'main' ) {
      this.unsyncChat();
      this.firestore.collection('books').doc(this.bookService.curBookId).collection('chats').doc(chatId).delete();
      this.navCtrl.navigateRoot('/tabs-book');
    } else {
      this.popupService.toast('Le premier chat ne peut pas être supprimé');
    }
  }

  async renameChat() {
    const alert = await this.alertController.create({
      header: 'Changer de pseudo',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Votre pseudo',
          value: this.chat.name,
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: 'Ok',
          handler: (data) => {
            this.firestore.collection('books').doc(this.bookService.curBookId)
                          .collection('chats').doc(this.curChatId).update({name: data.name});
          }
        }
      ]
    });
    await alert.present();
  }

  setChatLogs(logs) {
    this.firestore.collection('books').doc(this.bookService.curBookId).collection('chats').doc(this.curChatId).update({logs});
  }

  getLog(line: number) {
    return this.chatLogs[line];
  }

  getLabels(): any[] {
    const res = [];
    this.chatLogs.forEach(element => {
      if (element.action === 'label') {
        res.push(element.number);
      }
    });
    return res;
  }

  getNewLabel(): number {
    let labels = this.getLabels();
    labels = labels.sort();
    for (let i = 0; i < labels.length; i++) {
      if (labels[i] !== i + 1) {
        return i + 1;
      }
    }
    return labels.length + 1;
  }

  getLabelLine(nb) {
    for (let i = 0; i < this.chatLogs.length; i++) {
      const log = this.chatLogs[i];
      if (log.msg === 'label') {
        if (log.number === nb) {
          return i;
        }
      }
    }
    return -1;
  }

  getChatIdByName(chatName: string) {
    for (const chat of this.bookService.chats) {
      if (chat.name === chatName) {
        return chat.id;
      }
    }
    return this.chat;
  }

  haveChat(chatName: string): boolean {
    for (const chat of this.bookService.chats) {
      if (chat.name === chatName) {
        return true;
      }
    }
    return false;
  }

  getChat(chatId: string) {
    for (const chat of this.bookService.chats) {
      if (chat.id.toUpperCase() === chatId.toUpperCase()) {
        return chat;
      }
    }
  }
}
