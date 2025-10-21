// Convertir un nombre en lettres (français)
export function numberToWords(num: number, devise: string = 'USD'): string {
  if (isNaN(num) || num < 0) return '';
  
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  
  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    
    let result = '';
    
    // Centaines
    const cent = Math.floor(n / 100);
    if (cent > 0) {
      if (cent === 1) {
        result += 'cent';
      } else {
        result += unites[cent] + ' cent';
      }
      if (n % 100 === 0 && cent > 1) {
        result += 's';
      }
    }
    
    n %= 100;
    
    if (n === 0) return result.trim();
    
    if (result) result += ' ';
    
    // Dizaines et unités
    if (n < 10) {
      result += unites[n];
    } else if (n < 20) {
      result += teens[n - 10];
    } else {
      const diz = Math.floor(n / 10);
      const unit = n % 10;
      
      if (diz === 7 || diz === 9) {
        result += dizaines[diz] + '-' + teens[unit];
      } else {
        result += dizaines[diz];
        if (unit === 1 && diz !== 8) {
          result += ' et un';
        } else if (unit > 0) {
          result += '-' + unites[unit];
        }
        if (diz === 8 && unit === 0) {
          result += 's';
        }
      }
    }
    
    return result.trim();
  }
  
  if (num === 0) {
    return devise === 'USD' ? 'zéro dollar' : 'zéro franc';
  }
  
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  
  let result = '';
  
  if (integerPart >= 1000000000) {
    const billions = Math.floor(integerPart / 1000000000);
    result += convertLessThanThousand(billions) + ' milliard';
    if (billions > 1) result += 's';
    const remainder = integerPart % 1000000000;
    if (remainder > 0) {
      result += ' ' + numberToWords(remainder, '').replace(/dollars?|francs?/g, '').trim();
    }
  } else if (integerPart >= 1000000) {
    const millions = Math.floor(integerPart / 1000000);
    result += convertLessThanThousand(millions) + ' million';
    if (millions > 1) result += 's';
    const remainder = integerPart % 1000000;
    if (remainder > 0) {
      result += ' ' + numberToWords(remainder, '').replace(/dollars?|francs?/g, '').trim();
    }
  } else if (integerPart >= 1000) {
    const thousands = Math.floor(integerPart / 1000);
    if (thousands === 1) {
      result += 'mille';
    } else {
      result += convertLessThanThousand(thousands) + ' mille';
    }
    const remainder = integerPart % 1000;
    if (remainder > 0) {
      result += ' ' + convertLessThanThousand(remainder);
    }
  } else {
    result += convertLessThanThousand(integerPart);
  }
  
  // Ajouter la devise
  result = result.trim();
  if (devise === 'USD') {
    result += integerPart > 1 ? ' dollars' : ' dollar';
  } else {
    result += integerPart > 1 ? ' francs' : ' franc';
  }
  
  // Ajouter les centimes
  if (decimalPart > 0) {
    result += ' et ' + convertLessThanThousand(decimalPart);
    result += devise === 'USD' ? ' cents' : ' centimes';
  }
  
  return result.trim();
}
