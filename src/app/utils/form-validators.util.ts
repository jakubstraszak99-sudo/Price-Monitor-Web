import { ValidatorFn, Validators } from '@angular/forms';

export function passwordsMatch(
  passwordField: string,
  confirmationField = 'repeatPassword',
): ValidatorFn {
  return (control) =>
    control.get(passwordField)?.value === control.get(confirmationField)?.value
      ? null
      : { mismatch: true };
}

export function targetPriceValidators(currentPrice?: number): ValidatorFn[] {
  const validators = [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)];
  if (currentPrice !== undefined && Number.isFinite(currentPrice)) {
    validators.push(Validators.max(currentPrice));
  }

  return validators;
}
