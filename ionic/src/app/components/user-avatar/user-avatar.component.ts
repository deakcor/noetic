import { Component, OnInit, Input } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.scss'],
})
export class UserAvatarComponent implements OnInit {

  @Input() userId: string;
  @Input() page = false;
  @Input() width = '50px';

  userAsync: Observable<unknown>;

  constructor(
    private userService: UserService
    ) {}

  ngOnInit() {
    if (this.userId === this.userService.userId) {
      this.userAsync = this.userService.user;
    } else {
      this.userAsync = this.userService.getUser(this.userId);
    }
  }

  openProfile() {
    if (!this.page) {
      this.userService.openUser(this.userId);
    }
  }
}
