import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFirestoreCollection } from '@angular/fire/firestore/public_api';
import { Observable, Subscription } from 'rxjs';
import { NavController, AlertController } from '@ionic/angular';
import { AngularFireStorage } from '@angular/fire/storage';
import { TraductionService } from './traductionService.service';
import { UserService } from './user.service';
import { PopupService } from './popup.service';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  booksCollection: AngularFirestoreCollection<any>;

  curBookId: string;
  curChatId: string;
  lang: string;
  book: any;
  isAuthor: boolean;

  debug = false;


  bookSub: Subscription;
  bookChatSub: Subscription;
  bookActorSub: Subscription;
  bookPlaceSub: Subscription;

  chats: any[] = [];
  actors: any[] = [];
  places: any[] = [];

  actorsById: any = {};
  category = [
    'action',
    'adventure',
    'fanfiction',
    'fantastic',
    'fiction',
    'horror',
    'humor',
    'mystery',
    'nonfiction',
    'romance',
    'scifi',
    'thriller'
  ];

  constructor(
    private firestore: AngularFirestore,
    private firestorage: AngularFireStorage,

    private alertController: AlertController,
    private navCtrl: NavController,
    private traduction: TraductionService,
    public userService: UserService,
    private popupService: PopupService
  ) {
    this.booksCollection = this.firestore.collection('books');
    this.lang = this.traduction.getCurLanguage();
   }

  getBooks(bookIdArray: any[]): Observable<any> {
    if (bookIdArray.length > 0 ) {
      return this.firestore.collection('books', ref => ref.where('id', 'in', bookIdArray)).valueChanges();
    } else {
      return new Observable<any>();
    }
  }

  generateBookId(): string {
    return this.firestore.createId();
  }

  async openBook(bookId) {
    await this.popupService.loading();
    this.curBookId = bookId;
    await this.syncBook();
    this.popupService.loadingDismiss();
    this.navCtrl.navigateForward('/tabs-book');
  }

  openChat(chatId) {
    this.curChatId = chatId;
    this.navCtrl.navigateForward('chat');
  }

  async newBook(book, cover = '', bookId = this.firestore.createId()) {
    await this.popupService.loading('Création...', 'creation');
    this.curBookId = bookId;
    // Ajouter l'id référant dans user
    this.userService.addBookRef(bookId);
    // Upload le cover si une image est chargée
    if (cover.charAt(0) !== '.') {
      this.uploadCover(cover, this.curBookId);
    }
    // Créer le livre, l'ouvir et y ajouter un chat
    this.firestore.collection('/books').doc(bookId).set(book).then(() => {
      this.navCtrl.pop().then( async () => {
        await this.openCover(bookId);
        await this.openBook(bookId);
        this.popupService.loadingDismiss('creation');
        this.addChat('main', true);
      });
      }
    );
  }

  async newChat() {
    const size = await this.getChatsSize();
    if (!(size > 10000000)) {
      const alert = await this.alertController.create({
        header: 'Ajouter un chat',
        inputs: [
          {
            name: 'name',
            type: 'text',
            placeholder: 'Nom'
          }
        ],
        buttons: [
          {
            text: 'Annuler',
            role: 'cancel',
            cssClass: 'secondary'
          }, {
            text: 'Créer',
            handler: (data) => {
              if (data.name) {
                this.addChat(data.name);
              } else {
                this.popupService.toast('Veuillez entrer un nom');
              }
            }
          }
        ]
      });
      await alert.present();
    } else {
      this.popupService.alert('Impossible créer un chat, votre livre est trop volumineux!');
    }
  }

  async getChatsSize() {
    let size = 0;
    this.chats.forEach(chat => {
      chat.logs.forEach(log => {
        size += log.msg.length;
      });
    });
    return size;
  }

  addChat(chatName , main = false) {
    if (chatName.toUpperCase() === 'MAIN' && !main) {
      this.popupService.toast('impossible d\'utiliser ce nom');
      return;
    }
    if (this.haveChat(chatName)) {
      this.popupService.toast('nom déjà utilisé');
      return;
    }
    let id = 'main';
    if (!main) {
      id = this.firestore.createId();
    }
    if (!this.chats.includes(chatName)) {
      this.firestore.collection('/books').doc(this.curBookId).collection('chats').doc(id).set({id, name: chatName, logs: []}).then(
        () => this.openChat(id)
      );
    }
  }

  haveChat(chatName: string): boolean {
    for (const chat of this.chats) {
      if (chat.name.toUpperCase() === chatName.toUpperCase()) {
        return true;
      }
    }
    return false;
  }

  uploadCover(file, bookId = this.curBookId) {
    const path = 'books/' + bookId + '/cover.png';
    this.firestorage.ref(path).putString(file, 'data_url').then( () => {
      this.firestorage.ref(path).getDownloadURL().subscribe((ref) => {
        this.firestore.collection('books').doc(bookId).update({cover: ref});
      });
    });
  }

  getMostVue(lang = this.lang): Observable<any> {
    return this.firestore.collection(
      'books', ref => ref.where('public', '==', true).where('lang', '==', lang).orderBy('views', 'desc').limit(10)
      ).valueChanges();
  }

  getTopRated(lang = this.lang): Observable<any> {
    return this.firestore.collection(
      'books', ref => ref.where('public', '==', true).where('lang', '==', lang).orderBy('starsAvg', 'desc').limit(10)
      ).valueChanges();
  }

  getMostRecent(lang = this.lang): Observable<any> {
    return this.firestore.collection(
      'books', ref => ref.where('public', '==', true).where('lang', '==', lang).orderBy('date', 'desc').limit(10)
      ).valueChanges();
  }

  searchByName(filter: string, lang = this.lang): Observable<any> {
    const queryByName = this.firestore.collection(
       'books', ref => ref.where('public', '==', true)
                          .where('lang', '==', lang)
                          .orderBy('titleLower')
                          .startAt(filter.toLowerCase())
                          .endAt(filter.toLowerCase() + '\uf8ff')
                          .limit(10)
      ).valueChanges();
    return queryByName;
  }

  searchByTag(filter: string, lang = this.lang): Observable<any> {
    const filterArray = filter.split(' ');
    const queryByTag = this.firestore.collection(
       'books', ref => ref.where('public', '==', true)
                          .where('lang', '==', lang)
                          .where('tags', 'array-contains-any', filterArray)
                          .limit(10)
      ).valueChanges();
    return queryByTag;
  }

  async deleteBook(bookId = this.curBookId) {
    await this.popupService.loading('Suppression...');
    this.navCtrl.navigateRoot('/tabs/profile');
    // retirer book de la liste
    this.userService.deleteBookRef(bookId);
    // supprimer book
    const bookRef = this.firestore.collection('/books').doc(bookId);
    // S'il n'y a plus d'autheur, le livre est supprimé
    this.removeAuthor(bookId).then(lenAutors => {
      if (lenAutors === 0) {
        this.unsyncBook();
        // On supprime les sous-collections
        const subCollections = ['chats', 'actors', 'comments'];
        subCollections.forEach((subCollection) => {
          this.firestore.collection('books').doc(bookId).collection(subCollection).get().subscribe((data) => {
            data.docs.forEach((doc) => doc.ref.delete());
          });
        });
        // On supprime les médias
        if (this.haveCover()) {
          this.firestorage.ref('books/' + bookId + '/cover.png').delete();
        }
        this.firestore.collection('books').doc(bookId).collection('medias').get().subscribe((data) => {
          data.docs.forEach((doc) => {
            // On supprime le média associé à la référence
            const ref = doc.data().ref;
            this.firestorage.ref(ref).delete();
            doc.ref.delete();
          });
        });
        // On supprime le document du livre
        bookRef.delete();
        this.popupService.loadingDismiss();
      }
    });
  }

  addMediaRef(url: string, ref: string) {
    this.firestore.collection('books').doc(this.curBookId).collection('medias').add({url, ref});
  }

  deleteMedia(url: string) {
    this.firestore.collection('books').doc(this.curBookId)
                  .collection('medias', ref => ref.where('url', '==', url)).get().subscribe((val) => {
      val.docs.forEach(doc => {
        const ref = doc.data().ref;
        this.firestorage.ref(ref).delete();
        doc.ref.delete();
      });
    });
  }

  addAuthor(bookId, userId = this.userService.userId) {
    const bookRef = this.firestore.collection('books').doc(bookId);
    const bookSub = bookRef.get().subscribe((val) => {
      const authors: string[] = val.data().authors;
      if (!authors.includes(userId)) {
        if (authors.length >= 10) {
          authors.push(userId);
          bookRef.update({authors});
        } else {
          this.popupService.alert('Il ne peut pas y avoir plus de 10 auteurs par livre.');
        }
      } else {
        this.popupService.alert('Vous êtes déjà auteur de ce livre.');
      }
      bookSub.unsubscribe();
    });
  }

  async removeAuthor(bookId, userId = this.userService.userId): Promise<number> {
    let lenAuthors = 0;
    const bookRef = this.firestore.collection('books').doc(bookId);
    const bookPromise = new Promise (res => {
      const bookSub = bookRef.get().subscribe((val) => {
        const authors: string[] = val.data().authors;
        const index = authors.indexOf(userId);
        if (index > -1) {
          authors.splice(index, 1);
          bookRef.update({authors});
        }
        lenAuthors = authors.length;
        bookSub.unsubscribe();
        res();
      });
    });
    await bookPromise;
    return new Promise(result => result(lenAuthors));
  }

  haveCover(): boolean {
    return this.book.cover.charAt(0) !== '.';
  }

  getBook(bookId) {
    return this.firestore.collection('books').doc(bookId).valueChanges();
  }

  updateBookData(data, curBookId: string = this.curBookId) {
    this.booksCollection.doc(curBookId).update(data);
  }

  async syncBook(curBookId = this.curBookId, cover: boolean = false): Promise<any> {
    let bookPromise: Promise<any>;
    bookPromise = new Promise(res => {
      this.bookSub = this.firestore.collection('books').doc(curBookId).valueChanges().subscribe((value: any) => {
        if (value) {
          this.book = value;
          this.book.stars = this.book.starsAvg;
          this.book.starsArray = new Array(this.book.stars);
          this.isAuthor = this.book.authors.includes(this.userService.userId) && this.userService.connected;
          res();
        }
      });
    });
    let bookChatPromise: Promise<any>;
    let bookActorPromise: Promise<any>;
    if (!cover) {
      bookChatPromise = new Promise(res => {
        this.bookChatSub = this.firestore.collection('books').doc(curBookId).collection('chats').valueChanges().subscribe((value) => {
          this.chats = value;
          res();
        });
      });
      bookActorPromise = new Promise(res => {
        this.bookActorSub = this.firestore.collection('books').doc(curBookId).collection('actors').valueChanges().subscribe((value) => {
          this.actorsById = {};
          this.actors = value;
          value.forEach(actor => {
            this.actorsById[actor.id] = actor;
          });
          res();
        });
      });
    }
    await bookPromise;
    if (!cover) {
      await bookChatPromise;
      await bookActorPromise;
    }
    return new Promise(res => res());
  }

  unsyncBook(cover = false) {
    this.bookSub.unsubscribe();
    if (!cover) {
      this.bookChatSub.unsubscribe();
      this.bookActorSub.unsubscribe();
    }
  }

  // uploadFile(type: string, file: any, id= this.userId) {
  //   let path = '';
  //   if (type == 'userAvatar') {
  //     path = 'users/'+ id +'/avatar.png';
  //   }
  //   if (type === 'cover') {
  //     path = 'books/'+ id +'/cover.png';
  //   }
  //   this.firestorage.ref(path).putString(file, 'data_url').then( () => {
  //     if (type === 'userAvatar') {
  //       this.firestorage.ref(path).getDownloadURL().subscribe((ref) => {
  //         this.firestore.collection('users').doc(id).update({avatar: ref});
  //       });
  //     }
  //     if (type === 'cover') {
  //       this.firestorage.ref(path).getDownloadURL().subscribe((ref) => {
  //         this.firestore.collection('books').doc(id).update({cover: ref});
  //       });
  //     }
  //   }
  //   );
  // }

  publishBook() {
    this.firestore.collection('/books').doc(this.curBookId).update({public: true});
  }

  unpublishBook() {
    this.firestore.collection('/books').doc(this.curBookId).update({public: false});
  }

  getCategory(category) {
    const res = [];
    const lang = this.userService.userData.lang;
    this.firestore.collection(
      'books',
       ref => ref.where('public', '==', true).where('lang', '==', lang).where('cat', '==', category).orderBy('views', 'desc').limit(10)
      ).get().subscribe((data) => {
      data.docs.forEach((doc) => {
        res.push(doc.data());
      });
      if (res.length === 0) {
        this.popupService.toast('catégorie vide pour le moment');
      }
    });
    return res;
  }

  async openCover(bookId: string) {
    await this.popupService.loading('Ouverture...', 'opening');
    this.curBookId = bookId;
    this.syncBook(this.curBookId, true).then(() => {
      this.popupService.loadingDismiss('opening');
      this.navCtrl.navigateForward('cover');
    });
  }

  async play(id = this.curBookId, chatId = 'main', debug = false) {
    await this.popupService.loading();
    this.debug = debug;
    this.curChatId = chatId;
    this.firestore.collection('books').doc(id).update({
      views: this.book.views + 1,
    });
    this.curBookId = id;
    await this.syncBook();
    this.popupService.loadingDismiss();
    this.navCtrl.navigateForward('/game');
  }

  getUserById(userId): Observable<any> {
    return this.firestore.collection('users').doc(userId).get();
  }

  getBookById(bookId): Observable<any> {
    return this.firestore.collection('books').doc(bookId).get();
  }
}
