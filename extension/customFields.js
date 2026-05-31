// Custom Fields Filling Module
// Handles filling of custom fields from KeePass entries

(function() {
  'use strict';

  window.__kbbCustomFields = {
    /**
     * Fill custom fields into the page
     * @param {Array} customFields - Array of custom field objects
     * @param {Document|HTMLElement} root - Optional search scope
     * @returns {Object} - Result of filling operation
     */
    fillCustomFields: function(customFields, root) {
      if (!customFields || customFields.length === 0) {
        return { filled: 0, fields: [] };
      }

      const result = {
        filled: 0,
        fields: []
      };

      for (const field of customFields) {
        // Try to find input by field name
        const input = this.findInputByFieldName(field.Name, root);
        
        if (input) {
          setInputValue(input, field.Value);
          result.filled++;
          result.fields.push({
            name: field.Name,
            filled: true
          });
        } else {
          result.fields.push({
            name: field.Name,
            filled: false
          });
        }
      }

      return result;
    },

    /**
     * Find input field by custom field name
     * @param {string} fieldName - Name of the custom field
     * @param {Document|HTMLElement} root - Optional search scope
     * @returns {HTMLElement|null} - Input element or null
     */
    findInputByFieldName: function(fieldName, root) {
      const scope = root && root.querySelectorAll ? root : document;
      const normalizedName = normalizeText(fieldName);
      const inputs = Array.from(scope.querySelectorAll('input'))
        .filter((input) => isVisible(input) && !input.disabled && !input.readOnly);

      let input = findInputByAttribute(inputs, 'placeholder', normalizedName);
      if (input) return input;

      // Try to find by label
      const labels = Array.from(scope.querySelectorAll('label'));
      for (const label of labels) {
        if (normalizeText(label.textContent).includes(normalizedName)) {
          const forAttr = label.getAttribute('for');
          if (forAttr) {
            input = findElementById(scope, forAttr);
            if (input && isVisible(input) && !input.disabled && !input.readOnly) {
              return input;
            }
          }
          
          // Try to find input within label
          input = label.querySelector('input');
          if (input && isVisible(input) && !input.disabled && !input.readOnly) {
            return input;
          }
        }
      }

      // Try to find by name attribute
      input = findInputByAttribute(inputs, 'name', normalizedName);
      if (input) return input;

      // Try to find by id attribute
      input = findInputByAttribute(inputs, 'id', normalizedName);
      if (input) return input;

      return null;
    },

    /**
     * Copy custom field value to clipboard
     * @param {string} value - Value to copy
     * @param {number} clearAfterMs - Clear clipboard after this many milliseconds
     */
    copyToClipboard: async function(value, clearAfterMs) {
      try {
        await navigator.clipboard.writeText(value);
        
        if (clearAfterMs && clearAfterMs > 0) {
          setTimeout(() => {
            navigator.clipboard.writeText('').catch(() => {});
          }, clearAfterMs);
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  };

  // Helper function to check if element is visible
  function isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  function findInputByAttribute(inputs, attributeName, normalizedName) {
    for (const input of inputs) {
      const value = attributeName === 'id' ? input.id : input.getAttribute(attributeName);
      if (normalizeText(value).includes(normalizedName)) {
        return input;
      }
    }

    return null;
  }

  function findElementById(scope, id) {
    if (scope.getElementById) return scope.getElementById(id);
    if (scope.querySelectorAll) {
      return Array.from(scope.querySelectorAll('input')).find((input) => input.id === id) || null;
    }
    return null;
  }

  function normalizeText(value) {
    return String(value || '').toLowerCase().trim();
  }

  // Helper function to set input value
  function setInputValue(input, value) {
    if (!input) return;
    
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  }
})();
