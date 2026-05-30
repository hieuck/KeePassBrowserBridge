'use strict';

function generatePassword(options = {}) {
  const length = options.length || 16;
  const useUpper = options.useUpper !== false;
  const useLower = options.useLower !== false;
  const useNumbers = options.useNumbers !== false;
  const useSymbols = options.useSymbols !== false;

  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

  let charset = '';
  if (useUpper) charset += upperChars;
  if (useLower) charset += lowerChars;
  if (useNumbers) charset += numberChars;
  if (useSymbols) charset += symbolChars;

  if (!charset) {
    throw new Error('At least one character type must be selected');
  }

  const result = new Uint32Array(length);
  crypto.getRandomValues(result);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[result[i] % charset.length];
  }

  // Ensure at least one character from each selected set is included
  const requiredChars = [];
  if (useUpper) requiredChars.push(upperChars[crypto.getRandomValues(new Uint32Array(1))[0] % upperChars.length]);
  if (useLower) requiredChars.push(lowerChars[crypto.getRandomValues(new Uint32Array(1))[0] % lowerChars.length]);
  if (useNumbers) requiredChars.push(numberChars[crypto.getRandomValues(new Uint32Array(1))[0] % numberChars.length]);
  if (useSymbols) requiredChars.push(symbolChars[crypto.getRandomValues(new Uint32Array(1))[0] % symbolChars.length]);

  if (requiredChars.length > 0 && requiredChars.length <= length) {
    const passwordArray = password.split('');
    const positions = new Uint32Array(requiredChars.length);
    crypto.getRandomValues(positions);
    
    // We need unique positions to place the required characters
    let availablePositions = Array.from({length: length}, (_, i) => i);
    
    for (let i = 0; i < requiredChars.length; i++) {
        // Randomly pick an available position
        const indexToPick = positions[i] % availablePositions.length;
        const pos = availablePositions[indexToPick];
        passwordArray[pos] = requiredChars[i];
        // Remove picked position
        availablePositions.splice(indexToPick, 1);
    }
    password = passwordArray.join('');
  }

  return password;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generatePassword };
}
