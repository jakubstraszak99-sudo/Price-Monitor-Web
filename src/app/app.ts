import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './components/toast/toast';
import { LanguageService } from './services/language.service';
import { ModalService } from './services/modal-service';
import { Navbar } from './components/navbar/navbar';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { AddProduct } from './components/add-product/add-product';
import { ProductDetails } from './components/product-details/product-details';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { SessionService } from './services/session-service';
import { SocketService } from './services/socket-service';

@Component({
  imports: [
    RouterOutlet,
    Toast,
    Navbar,
    Login,
    Register,
    AddProduct,
    ProductDetails,
    ForgotPassword,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  private readonly languageService = inject(LanguageService);
  private readonly sessionService = inject(SessionService);
  private readonly socketService = inject(SocketService);
  protected readonly modalService = inject(ModalService);

  constructor() {
    this.languageService.initLanguage();
    effect(() => {
      if (this.sessionService.isLoggedIn()) {
        this.socketService.connect();
      } else {
        this.socketService.disconnect();
      }
    });
  }
}
