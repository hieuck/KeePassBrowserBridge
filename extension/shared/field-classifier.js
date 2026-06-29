export function isSubmitControl(element) {
  if (!element || !element.tagName) return false;
  const tagName = element.tagName.toLowerCase();
  const type = (element.getAttribute('type') || '').toLowerCase();
  if (tagName === 'input') return type === 'submit';
  if (tagName === 'button') return type === '' || type === 'submit';
  return false;
}

export function hasLoginIntentText(text) {
  return /\bsign\s*in\b|\blog\s*in\b|\blogin\b/.test(String(text || ''));
}

export function isProfileOrPaymentFieldText(text) {
  const normalized = String(text || '').replace(/\be-?mail[\s_-]+address\b/g, 'email');
  return /\b(city|address|street|postal|postcode|zip|state|province|country|shipping|billing|checkout|receipt|profile|full\s*name|first\s*name|last\s*name|card|cardholder|ccname|cc-name|ccnumber|cc-number|cc-csc|cvc|cvv|security\s*code|payment|pay\s*now|accounts\s*per\s*page|pagesize)\b/.test(normalized);
}

export function isNonLoginCommunicationContext(text) {
  return /\b(contact|support|message|send\s+message|feedback|comment|inquiry|enquiry|help\s+request|ticket)\b/.test(String(text || ''));
}

export function isAccountRecoveryContext(text) {
  return /\b(forgot|reset|recover|recovery|trouble\s+signing\s+in|account\s+help|password\s+help|send\s+(a\s+)?(recovery|reset)\s+link)\b/.test(String(text || ''));
}

export function isFilterOrSearchFieldText(text) {
  return /\b(search|filter|datatable|data\s*table|table\s*filter|list\s*filter)\b/.test(String(text || ''));
}

export function isDeveloperSecretContext(text) {
  return /\b(api|developer|dev\s*tools|command\s+line|cli|personal\s+access|access\s+token|auth\s+token|client\s+secret|webhook\s+secret|secret\s+key|api\s+key|token\s+name|rotate\s+the\s+api\s+token)\b/.test(String(text || ''));
}

export function isTelephoneIdentifierField(type, autocomplete) {
  return type === 'tel' || autocomplete === 'tel';
}

export function isNonCredentialAutocomplete(input) {
  if (!input || !input.getAttribute) return false;
  const autocomplete = String(input.getAttribute('autocomplete') || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .pop() || '';
  if (!autocomplete || autocomplete === 'off' || autocomplete === 'on') return false;
  if (autocomplete === 'username' || autocomplete === 'current-password' || autocomplete === 'one-time-code') {
    return false;
  }
  if (autocomplete === 'new-password') return true;
  return /^(name|honorific-prefix|given-name|additional-name|family-name|honorific-suffix|nickname|organization-title|organization|street-address|address-line1|address-line2|address-line3|address-level1|address-level2|address-level3|address-level4|country|country-name|postal-code|cc-name|cc-given-name|cc-additional-name|cc-family-name|cc-number|cc-exp|cc-exp-month|cc-exp-year|cc-csc|cc-type|transaction-currency|transaction-amount|language|bday|bday-day|bday-month|bday-year|sex|url|photo|tel|tel-country-code|tel-national|tel-area-code|tel-local|tel-local-prefix|tel-local-suffix|tel-extension|impp)$/.test(autocomplete);
}

export function fieldText(input) {
  const parts = [
    input.getAttribute('autocomplete') || '',
    input.getAttribute('name') || '',
    input.id || '',
    input.getAttribute('placeholder') || '',
    input.getAttribute('aria-label') || '',
    referencedElementText(input, 'aria-labelledby'),
    referencedElementText(input, 'aria-describedby'),
  ];
  const label = input.closest ? input.closest('label') : null;
  if (label && label.textContent) parts.push(label.textContent);
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function referencedElementText(input, attributeName) {
  const ids = String(input.getAttribute(attributeName) || '')
    .split(/\s+/)
    .filter(Boolean);
  if (!ids.length) return '';
  const ownerDocument = input.ownerDocument || document;
  return ids
    .map((id) => {
      const ref = ownerDocument.getElementById(id);
      return ref && ref.textContent ? ref.textContent : '';
    })
    .join(' ');
}

export function credentialContextText(input) {
  const parts = [fieldText(input)];
  const form = input && input.form ? input.form : input && input.closest ? input.closest('form') : null;
  if (form && form.textContent) {
    parts.push(form.textContent);
  return parts.join(' ').toLowerCase().trim();
  }
  const region = input && input.closest
    ? input.closest('fieldset, [role="form"], dialog, section, article')
    : null;
  if (region && region.textContent) parts.push(region.textContent.slice(0, 2000));
  return parts.join(' ').toLowerCase();
}

export function isCurrentPasswordInput(input, fieldTextFn = fieldText) {
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();
  if (autocomplete === 'current-password') return true;
  return /\b(current|old|existing)\b/.test(fieldTextFn(input));
}

export function isNewPasswordInput(input, fieldTextFn = fieldText) {
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();
  if (autocomplete === 'new-password') return true;
  return /\b(new|confirm|confirmation|repeat|retype)\b/.test(fieldTextFn(input));
}

export function isChangePasswordForm(passwordInputs, deps = { isCurrentPasswordInput, isNewPasswordInput, fieldText }) {
  return passwordInputs.some((input) => deps.isCurrentPasswordInput(input, deps.fieldText)) &&
    passwordInputs.some((input) => deps.isNewPasswordInput(input, deps.fieldText));
}

export function isLoginPasswordInput(input, fieldTextFn = fieldText) {
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();
  const text = fieldTextFn(input);
  const context = credentialContextText(input);
  if (isNonCredentialAutocomplete(input)) return false;
  if (isProfileOrPaymentFieldText(context)) return false;
  if (autocomplete === 'current-password') return true;
  if (isDeveloperSecretContext(context)) return false;
  if (autocomplete === 'new-password') return false;
  if (/\b(new|confirm|confirmation|repeat|retype)\b/.test(text)) return false;
  return true;
}

export function isOtpDigitInput(input, fieldTextFn = fieldText) {
  const maxLength = Number(input.getAttribute('maxlength') || input.maxLength || 0);
  if (maxLength !== 1) return false;
  const type = (input.getAttribute('type') || 'text').toLowerCase();
  if (!['text', 'tel', 'number', 'password', ''].includes(type)) return false;
  return scoreOtpCandidate(input, fieldTextFn) > 0;
}

export function scoreOtpCandidate(input, fieldTextFn = fieldText) {
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();
  const inputMode = (input.getAttribute('inputmode') || '').toLowerCase();
  const text = fieldTextFn(input);
  const context = credentialContextText(input);
  let score = 0;
  if (isNonCredentialAutocomplete(input)) score -= 999;
  if (isProfileOrPaymentFieldText(text) || isDeveloperSecretContext(context)) score -= 999;
  if (autocomplete === 'one-time-code') score += 120;
  if (/otp|totp|2fa|mfa|authenticator|verification|passcode/.test(text))
    score += 90;
  if (/nhập mã|nhap ma|mã xác minh|ma xac minh|xác minh|xac minh|mã xác thực|ma xac thuc/.test(text))
    score += 90;
  if (/\bcode\b|\btoken\b|\bpin\b/.test(text)) score += 45;
  // Strong negative signals for non-OTP contexts
  if (/\bpost(al)?\s*code\b|\bzip\b|\barea\s*code\b|\bcvv\b|\bcvc\b|\bsecurity\s*code\b/i.test(text))
    score -= 999;
  if (inputMode === 'numeric' && score > 0) score += 10;
  if (/\bsearch\b/i.test(text))
    score -= 999;
  if (/\busername\b|\bemail\b|\buser\b|\blogin\b|first|last|name/.test(text))
    score -= 500;
  if ((input.getAttribute('type') || '').toLowerCase() === 'password')
    score -= 15;
  return score;
}

export function documentOrder(left, right) {
  if (left === right) return 0;
  return left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

export function isVisible(element) {
  if (element.closest && element.closest('[aria-hidden="true"], [hidden]')) {
    return false;
  }
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    style.opacity !== '0' &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.right > 0 &&
    rect.left < window.innerWidth
  );
}

export function editableInputFromElement(element, isVisibleFn = isVisible) {
  if (!element || !isVisibleFn(element) || element.disabled || element.readOnly) {
    return null;
  }
  const tagName = String(element.tagName || element.nodeName || '').toLowerCase();
  if (tagName === 'textarea') return element;
  if (tagName && tagName !== 'input') {
    return null;
  }
  if (!tagName && typeof element.getAttribute !== 'function') {
    return null;
  }
  const type = (element.getAttribute('type') || 'text').toLowerCase();
  return ['text', 'email', 'tel', 'url', 'search', 'number', 'password', ''].includes(type)
    ? element
    : null;
}

export function credentialKey(credential) {
  return [
    credential.url || '',
    credential.userName || '',
    String(credential.userName || '').toLowerCase(),
    credential.password || '',
  ].join('\n');
}
