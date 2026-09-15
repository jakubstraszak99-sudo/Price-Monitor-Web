import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './components/toast/toast';
import { LanguageService } from './services/language.service';
import { ModalService } from './services/modal-service';
import { Navbar } from './components/navbar/navbar';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { AddProduct } from './components/add-product/add-product';
import { ProductDetails } from './components/product-details/product-details';

@Component({
  imports: [RouterOutlet, Toast, Navbar, Login, Register, AddProduct, ProductDetails],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly languageService = inject(LanguageService);
  protected readonly modalService = inject(ModalService);

  public ngOnInit(): void {
    this.languageService.initLanguage();
  }
}
