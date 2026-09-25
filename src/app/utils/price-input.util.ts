import { FormControl } from '@angular/forms';

export function normalizePriceInput(value: string): string {
  const [whole, ...fraction] = value
    .replace(/[^0-9.,]/g, '')
    .replace(/,/g, '.')
    .split('.');
  return fraction.length ? whole + '.' + fraction.join('') : whole;
}

export function updatePriceInput(event: Event, control: FormControl<string>): void {
  const input = event.target as HTMLInputElement;
  const value = normalizePriceInput(input.value);
  input.value = value;
  control.setValue(value, { emitEvent: false });
}
