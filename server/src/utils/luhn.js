/**
 * Luhn algorithm for credit/debit card number validation.
 */
export function luhnValidate(num) {
  const digits = String(num).replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  
  let sum = 0;
  let alternate = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  
  return sum % 10 === 0;
}
