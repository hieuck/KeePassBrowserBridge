import { describe, it, assert } from 'vitest';

const importModule = () => import('../../extension/shared/field-classifier.js');

describe('field-classifier - isSubmitControl', () => {
  it('should return true for <input type="submit">', async () => {
    const { isSubmitControl } = await import('../../extension/shared/field-classifier.js');
    const input = document.createElement('input');
    input.setAttribute('type', 'submit');
    assert.ok(isSubmitControl(input));
  });

  it('should return true for <button> without type', async () => {
    const { isSubmitControl } = await import('../../extension/shared/field-classifier.js');
    const btn = document.createElement('button');
    assert.ok(isSubmitControl(btn));
  });

  it('should return true for <button type="submit">', async () => {
    const { isSubmitControl } = await import('../../extension/shared/field-classifier.js');
    const btn = document.createElement('button');
    btn.setAttribute('type', 'submit');
    assert.ok(isSubmitControl(btn));
  });

  it('should return false for <input type="text">', async () => {
    const { isSubmitControl } = await import('../../extension/shared/field-classifier.js');
    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    assert.ok(!isSubmitControl(input));
  });

  it('should return false for <button type="button">', async () => {
    const { isSubmitControl } = await import('../../extension/shared/field-classifier.js');
    const btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    assert.ok(!isSubmitControl(btn));
  });

  it('should return false for null/undefined', async () => {
    const { isSubmitControl } = await importModule();
    assert.ok(!isSubmitControl(null));
    assert.ok(!isSubmitControl(undefined));
  });
});

describe('field-classifier - hasLoginIntentText', () => {
  it('should match "sign in"', async () => {
    const { hasLoginIntentText } = await importModule();
    assert.ok(hasLoginIntentText('Click here to sign in'));
  });

  it('should match "log in"', async () => {
    const { hasLoginIntentText } = await importModule();
    assert.ok(hasLoginIntentText('Please log in'));
  });

  it('should match "login" as standalone', async () => {
    const { hasLoginIntentText } = await importModule();
    assert.ok(hasLoginIntentText('login'));
  });

  it('should return false for "search"', async () => {
    const { hasLoginIntentText } = await importModule();
    assert.ok(!hasLoginIntentText('search the site'));
  });

  it('should return false for empty string', async () => {
    const { hasLoginIntentText } = await importModule();
    assert.ok(!hasLoginIntentText(''));
  });

  it('should return false for non-login text', async () => {
    const { hasLoginIntentText } = await importModule();
    assert.ok(!hasLoginIntentText('contact us'));
  });
});

describe('field-classifier - isProfileOrPaymentFieldText', () => {
  it('should match "address"', async () => {
    const { isProfileOrPaymentFieldText } = await importModule();
    assert.ok(isProfileOrPaymentFieldText('shipping address'));
  });

  it('should match "card number"', async () => {
    const { isProfileOrPaymentFieldText } = await importModule();
    assert.ok(isProfileOrPaymentFieldText('card number'));
  });

  it('should match "cvv"', async () => {
    const { isProfileOrPaymentFieldText } = await importModule();
    assert.ok(isProfileOrPaymentFieldText('cvv'));
  });

  it('should match "full name"', async () => {
    const { isProfileOrPaymentFieldText } = await importModule();
    assert.ok(isProfileOrPaymentFieldText('full name'));
  });

  it('should return false for "username"', async () => {
    const { isProfileOrPaymentFieldText } = await importModule();
    assert.ok(!isProfileOrPaymentFieldText('username'));
  });
});

describe('field-classifier - isNonLoginCommunicationContext', () => {
  it('should match "contact"', async () => {
    const { isNonLoginCommunicationContext } = await importModule();
    assert.ok(isNonLoginCommunicationContext('contact us'));
  });

  it('should match "support"', async () => {
    const { isNonLoginCommunicationContext } = await importModule();
    assert.ok(isNonLoginCommunicationContext('support request'));
  });

  it('should return false for "login"', async () => {
    const { isNonLoginCommunicationContext } = await importModule();
    assert.ok(!isNonLoginCommunicationContext('login'));
  });
});

describe('field-classifier - isAccountRecoveryContext', () => {
  it('should match "forgot password"', async () => {
    const { isAccountRecoveryContext } = await importModule();
    assert.ok(isAccountRecoveryContext('forgot password'));
  });

  it('should match "reset password"', async () => {
    const { isAccountRecoveryContext } = await importModule();
    assert.ok(isAccountRecoveryContext('reset your password'));
  });

  it('should match "recover account"', async () => {
    const { isAccountRecoveryContext } = await importModule();
    assert.ok(isAccountRecoveryContext('recover account'));
  });

  it('should return false for "login"', async () => {
    const { isAccountRecoveryContext } = await importModule();
    assert.ok(!isAccountRecoveryContext('login'));
  });
});

describe('field-classifier - isFilterOrSearchFieldText', () => {
  it('should match "search"', async () => {
    const { isFilterOrSearchFieldText } = await importModule();
    assert.ok(isFilterOrSearchFieldText('search'));
  });

  it('should match "filter"', async () => {
    const { isFilterOrSearchFieldText } = await importModule();
    assert.ok(isFilterOrSearchFieldText('filter results'));
  });

  it('should return false for "username"', async () => {
    const { isFilterOrSearchFieldText } = await importModule();
    assert.ok(!isFilterOrSearchFieldText('username'));
  });
});

describe('field-classifier - isDeveloperSecretContext', () => {
  it('should match "api key"', async () => {
    const { isDeveloperSecretContext } = await importModule();
    assert.ok(isDeveloperSecretContext('api key'));
  });

  it('should match "access token"', async () => {
    const { isDeveloperSecretContext } = await importModule();
    assert.ok(isDeveloperSecretContext('access token'));
  });

  it('should return false for "password"', async () => {
    const { isDeveloperSecretContext } = await importModule();
    assert.ok(!isDeveloperSecretContext('password'));
  });
});

describe('field-classifier - isTelephoneIdentifierField', () => {
  it('should return true for tel type', async () => {
    const { isTelephoneIdentifierField } = await importModule();
    assert.ok(isTelephoneIdentifierField('tel', ''));
  });

  it('should return true for tel autocomplete', async () => {
    const { isTelephoneIdentifierField } = await importModule();
    assert.ok(isTelephoneIdentifierField('text', 'tel'));
  });

  it('should return false for text type without tel autocomplete', async () => {
    const { isTelephoneIdentifierField } = await importModule();
    assert.ok(!isTelephoneIdentifierField('text', ''));
  });
});

describe('field-classifier - isNonCredentialAutocomplete', () => {
  it('should return true for address autocomplete', async () => {
    const { isNonCredentialAutocomplete } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('autocomplete', 'street-address');
    assert.ok(isNonCredentialAutocomplete(input));
  });

  it('should return false for username autocomplete', async () => {
    const { isNonCredentialAutocomplete } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('autocomplete', 'username');
    assert.ok(!isNonCredentialAutocomplete(input));
  });

  it('should return false for current-password autocomplete', async () => {
    const { isNonCredentialAutocomplete } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('autocomplete', 'current-password');
    assert.ok(!isNonCredentialAutocomplete(input));
  });

  it('should return true for new-password autocomplete', async () => {
    const { isNonCredentialAutocomplete } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('autocomplete', 'new-password');
    assert.ok(isNonCredentialAutocomplete(input));
  });

  it('should return false for off', async () => {
    const { isNonCredentialAutocomplete } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('autocomplete', 'off');
    assert.ok(!isNonCredentialAutocomplete(input));
  });

  it('should return false for null input', async () => {
    const { isNonCredentialAutocomplete } = await importModule();
    assert.ok(!isNonCredentialAutocomplete(null));
  });
});

describe('field-classifier - fieldText', () => {
  it('should return combined text from input attributes', async () => {
    const { fieldText } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('name', 'username');
    input.setAttribute('id', 'login-id');
    input.setAttribute('placeholder', 'Enter username');
    const result = fieldText(input);
    assert.ok(result.includes('username'));
    assert.ok(result.includes('login-id'));
    assert.ok(result.includes('enter username'));
  });

  it('should return lowercase text', async () => {
    const { fieldText } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('placeholder', 'USER NAME');
    assert.equal(fieldText(input), 'user name');
  });

  it('should include label text if input inside a label', async () => {
    const { fieldText } = await importModule();
    const label = document.createElement('label');
    label.textContent = 'Email Address';
    const input = document.createElement('input');
    label.appendChild(input);
    const result = fieldText(input);
    assert.ok(result.includes('email address'));
  });
});

describe('field-classifier - isCurrentPasswordInput', () => {
  it('should return true for current-password autocomplete', async () => {
    const { isCurrentPasswordInput, fieldText } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('autocomplete', 'current-password');
    assert.ok(isCurrentPasswordInput(input, fieldText));
  });

  it('should return true for field with "current" in text', async () => {
    const { isCurrentPasswordInput, fieldText } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('placeholder', 'Current password');
    assert.ok(isCurrentPasswordInput(input, fieldText));
  });

  it('should return true for field with "old" in text', async () => {
    const { isCurrentPasswordInput, fieldText } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('aria-label', 'Old password');
    assert.ok(isCurrentPasswordInput(input, fieldText));
  });

  it('should return false for new-password autocomplete', async () => {
    const { isCurrentPasswordInput, fieldText } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('autocomplete', 'new-password');
    assert.ok(!isCurrentPasswordInput(input, fieldText));
  });
});

describe('field-classifier - isNewPasswordInput', () => {
  it('should return true for new-password autocomplete', async () => {
    const { isNewPasswordInput, fieldText } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('autocomplete', 'new-password');
    assert.ok(isNewPasswordInput(input, fieldText));
  });

  it('should return true for field with "confirm" in text', async () => {
    const { isNewPasswordInput, fieldText } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('placeholder', 'Confirm password');
    assert.ok(isNewPasswordInput(input, fieldText));
  });

  it('should return true for field with "new" in text', async () => {
    const { isNewPasswordInput, fieldText } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('aria-label', 'New password');
    assert.ok(isNewPasswordInput(input, fieldText));
  });

  it('should return false for current-password autocomplete', async () => {
    const { isNewPasswordInput, fieldText } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('autocomplete', 'current-password');
    assert.ok(!isNewPasswordInput(input, fieldText));
  });
});

describe('field-classifier - isChangePasswordForm', () => {
  it('should return true when both current and new password inputs present', async () => {
    const { isChangePasswordForm, isCurrentPasswordInput, isNewPasswordInput, fieldText } = await importModule();
    const pw1 = document.createElement('input');
    pw1.setAttribute('autocomplete', 'current-password');
    const pw2 = document.createElement('input');
    pw2.setAttribute('autocomplete', 'new-password');
    assert.ok(isChangePasswordForm([pw1, pw2], { isCurrentPasswordInput, isNewPasswordInput, fieldText }));
  });

  it('should return false when only one password input', async () => {
    const { isChangePasswordForm, isCurrentPasswordInput, isNewPasswordInput, fieldText } = await importModule();
    const pw = document.createElement('input');
    pw.setAttribute('autocomplete', 'current-password');
    assert.ok(!isChangePasswordForm([pw], { isCurrentPasswordInput, isNewPasswordInput, fieldText }));
  });

  it('should return false when neither current nor new password context', async () => {
    const { isChangePasswordForm, isCurrentPasswordInput, isNewPasswordInput, fieldText } = await importModule();
    const pw1 = document.createElement('input');
    const pw2 = document.createElement('input');
    assert.ok(!isChangePasswordForm([pw1, pw2], { isCurrentPasswordInput, isNewPasswordInput, fieldText }));
  });
});

describe('field-classifier - isOtpDigitInput', () => {
  it('should return true for a single-digit OTP input with one-time-code autocomplete', async () => {
    const { isOtpDigitInput, fieldText } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('maxlength', '1');
    input.setAttribute('autocomplete', 'one-time-code');
    assert.ok(isOtpDigitInput(input, fieldText));
  });

  it('should return false for input with maxlength > 1', async () => {
    const { isOtpDigitInput, fieldText } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('maxlength', '6');
    input.setAttribute('autocomplete', 'one-time-code');
    assert.ok(!isOtpDigitInput(input, fieldText));
  });

  it('should return false for hidden input', async () => {
    const { isOtpDigitInput, fieldText } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    input.setAttribute('maxlength', '1');
    assert.ok(!isOtpDigitInput(input, fieldText));
  });
});

describe('field-classifier - documentOrder', () => {
  it('should return 0 for the same element', async () => {
    const { documentOrder } = await importModule();
    const el = document.createElement('div');
    assert.equal(documentOrder(el, el), 0);
  });

  it('should return -1 when left is before right in document', async () => {
    const { documentOrder } = await importModule();
    const parent = document.createElement('div');
    const first = document.createElement('span');
    const second = document.createElement('span');
    parent.appendChild(first);
    parent.appendChild(second);
    assert.equal(documentOrder(first, second), -1);
  });

  it('should return 1 when left is after right in document', async () => {
    const { documentOrder } = await importModule();
    const parent = document.createElement('div');
    const first = document.createElement('span');
    const second = document.createElement('span');
    parent.appendChild(first);
    parent.appendChild(second);
    assert.equal(documentOrder(second, first), 1);
  });
});

describe('field-classifier - isVisible', () => {
  it('should return false for hidden element', async () => {
    const { isVisible } = await importModule();
    const el = document.createElement('div');
    el.setAttribute('hidden', '');
    el.closest = () => el;
    assert.ok(!isVisible(el));
  });

  it('should return false for aria-hidden element', async () => {
    const { isVisible } = await importModule();
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    el.closest = () => el;
    assert.ok(!isVisible(el));
  });
});

describe('field-classifier - editableInputFromElement', () => {
  it('should return null for null input', async () => {
    const { editableInputFromElement } = await importModule();
    assert.equal(editableInputFromElement(null), null);
  });

  it('should return null for disabled input', async () => {
    const { editableInputFromElement, isVisible } = await importModule();
    const input = document.createElement('input');
    input.disabled = true;
    input.closest = () => null;
    assert.equal(editableInputFromElement(input, isVisible), null);
  });

  it('should return element for text input', async () => {
    const { editableInputFromElement } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    const result = editableInputFromElement(input, () => true);
    assert.equal(result, input);
  });

  it('should return null for non-text input type', async () => {
    const { editableInputFromElement, isVisible } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('type', 'checkbox');
    input.closest = () => null;
    assert.equal(editableInputFromElement(input, isVisible), null);
  });
});

describe('field-classifier - credentialKey', () => {
  it('should create a stable key from credential properties', async () => {
    const { credentialKey } = await importModule();
    const cred = { url: 'https://example.com', userName: 'user', password: 'pass' };
    const key = credentialKey(cred);
    assert.ok(key.includes('https://example.com'));
    assert.ok(key.includes('user'));
    assert.ok(key.includes('pass'));
  });

  it('should produce same key for same credentials', async () => {
    const { credentialKey } = await importModule();
    const cred1 = { url: 'https://example.com', userName: 'user', password: 'pass' };
    const cred2 = { url: 'https://example.com', userName: 'user', password: 'pass' };
    assert.equal(credentialKey(cred1), credentialKey(cred2));
  });

  it('should produce different keys for different passwords', async () => {
    const { credentialKey } = await importModule();
    const cred1 = { url: 'https://example.com', userName: 'user', password: 'pass1' };
    const cred2 = { url: 'https://example.com', userName: 'user', password: 'pass2' };
    assert.notEqual(credentialKey(cred1), credentialKey(cred2));
  });
});

describe('field-classifier - isLoginPasswordInput', () => {
  it('should return true for standard password input', async () => {
    const { isLoginPasswordInput, fieldText } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('type', 'password');
    input.setAttribute('autocomplete', 'current-password');
    assert.ok(isLoginPasswordInput(input, fieldText));
  });

  it('should return false for new-password input', async () => {
    const { isLoginPasswordInput, fieldText } = await importModule();
    const input = document.createElement('input');
    input.setAttribute('type', 'password');
    input.setAttribute('autocomplete', 'new-password');
    assert.ok(!isLoginPasswordInput(input, fieldText));
  });
});
