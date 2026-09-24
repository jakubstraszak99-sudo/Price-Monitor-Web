import { Service, signal } from '@angular/core';
import { Product } from '../api-client';

@Service()
export class ModalService {
  public readonly isLoginModalOpen = signal(false);
  public readonly isRegisterModalOpen = signal(false);
  public readonly isForgotPasswordModalOpen = signal(false);
  public readonly isChangePasswordModalOpen = signal(false);
  public readonly isAddProductModalOpen = signal(false);
  public readonly selectedProduct = signal<Product | null>(null);

  public openLogin(): void {
    this.isLoginModalOpen.set(true);
  }

  public closeLogin(): void {
    this.isLoginModalOpen.set(false);
  }

  public openRegister(): void {
    this.isRegisterModalOpen.set(true);
  }

  public closeRegister(): void {
    this.isRegisterModalOpen.set(false);
  }

  public openForgotPassword(): void {
    this.isLoginModalOpen.set(false);
    this.isForgotPasswordModalOpen.set(true);
  }

  public closeForgotPassword(): void {
    this.isForgotPasswordModalOpen.set(false);
  }

  public openChangePassword(): void {
    this.isChangePasswordModalOpen.set(true);
  }

  public closeChangePassword(): void {
    this.isChangePasswordModalOpen.set(false);
  }

  public openAddProduct(): void {
    this.isAddProductModalOpen.set(true);
  }

  public closeAddProduct(): void {
    this.isAddProductModalOpen.set(false);
  }

  public openProductDetails(data: Product): void {
    this.selectedProduct.set(data);
  }

  public closeProductDetails(): void {
    this.selectedProduct.set(null);
  }

  public requireLogin(): void {
    this.isChangePasswordModalOpen.set(false);
    this.isAddProductModalOpen.set(false);
    this.isForgotPasswordModalOpen.set(false);
    this.selectedProduct.set(null);
    this.isLoginModalOpen.set(true);
  }
}
