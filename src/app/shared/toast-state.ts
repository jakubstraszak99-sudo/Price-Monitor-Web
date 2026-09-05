export interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
  code?: string;
}

export type ToastType = 'success' | 'error';
