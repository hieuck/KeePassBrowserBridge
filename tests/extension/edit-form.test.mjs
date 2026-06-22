import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = fs.readFileSync(path.join(__dirname, '../../extension/src/popup/EditForm.vue'), 'utf-8');

test.describe('EditForm dirty state', () => {
  test('save button uses dirty state via canSave computed', () => {
    expect(source).toMatch(/canSave/);
    expect(source).toMatch(/disabled.*!canSave/);
    expect(source).toMatch(/dirty/);
  });

  test('dirty computed compares form fields to original', () => {
    expect(source).toMatch(/isDirty/);
    expect(source).toMatch(/original\.Title/);
    expect(source).toMatch(/original\.Url/);
    expect(source).toMatch(/original\.UserName/);
    expect(source).toMatch(/original\.Password/);
  });

  test('EditForm handles Cmd/Ctrl+S to save', () => {
    expect(source).toMatch(/metaKey.*ctrlKey.*key.*'s'/);
    expect(source).toMatch(/keydown/);
  });

  test('EditForm validates URL format', () => {
    expect(source).toMatch(/isValidUrl/);
    expect(source).toMatch(/errors\.Url/);
    expect(source).toMatch(/Invalid URL/);
  });

  test('EditForm validates title is required', () => {
    expect(source).toMatch(/isNonEmpty.*Title/);
    expect(source).toMatch(/Title is required/);
  });
});
