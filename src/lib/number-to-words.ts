/**
 * Converts a numerical currency value into Indian English Words (Rupees and Paise)
 * Example: 561822.40 -> "Five Lakh Sixty One Thousand Eight Hundred Twenty Two Rupees And Forty Paise Only"
 */

const units = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertTwoDigits(n: number): string {
  if (n < 20) return units[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return tens[t] + (u > 0 ? ' ' + units[u] : '');
}

function convertThreeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rem = n % 100;
  let res = '';
  if (h > 0) {
    res += units[h] + ' Hundred';
    if (rem > 0) res += ' ';
  }
  if (rem > 0) {
    res += convertTwoDigits(rem);
  }
  return res;
}

export function numberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Zero Rupees Only';

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const integerPart = Math.floor(absAmount);
  const fractionalPart = Math.round((absAmount - integerPart) * 100);

  let num = integerPart;
  const parts: string[] = [];

  // Crores (1,00,00,000)
  const crores = Math.floor(num / 10000000);
  if (crores > 0) {
    parts.push(numberToIndianWords(crores).replace(' Rupees Only', '') + ' Crore');
    num %= 10000000;
  }

  // Lakhs (1,00,000)
  const lakhs = Math.floor(num / 100000);
  if (lakhs > 0) {
    parts.push(convertTwoDigits(lakhs) + ' Lakh');
    num %= 100000;
  }

  // Thousands (1,000)
  const thousands = Math.floor(num / 1000);
  if (thousands > 0) {
    parts.push(convertTwoDigits(thousands) + ' Thousand');
    num %= 1000;
  }

  // Hundreds and remaining (100)
  if (num > 0) {
    parts.push(convertThreeDigits(num));
  }

  let words = parts.filter(Boolean).join(' ') + ' Rupees';

  if (fractionalPart > 0) {
    words += ' And ' + convertTwoDigits(fractionalPart) + ' Paise';
  }

  words += ' Only';

  return (isNegative ? 'Minus ' : '') + words;
}
