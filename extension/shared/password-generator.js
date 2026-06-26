export function generatePassword(length = 20, options = {}) {
  const { useSymbols = true, excludeAmbiguous = false } = options;
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const ambiguous = '1lI0O';
  let chars = lower + upper + digits + (useSymbols ? symbols : '');
  if (excludeAmbiguous) {
    for (const c of ambiguous) {
      chars = chars.replaceAll(c, '');
    }
  }
  let result = '';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    result += chars[arr[i] % chars.length];
  }
  return result;
}
