import { describe, expect, it } from 'vitest';

import {
  createInviteBodySchema,
  expenseListQuerySchema,
  readJsonBody,
  readSearchParams,
} from '../request-validation';

describe('request validation', () => {
  it('parses valid JSON and strips fields outside the schema', async () => {
    const request = new Request('http://localhost/api/groups', {
      method: 'POST',
      body: JSON.stringify({ email: 'ana@example.com', admin: true }),
    });

    const result = await readJsonBody(request, createInviteBodySchema);

    expect(result).toEqual({
      success: true,
      data: { email: 'ana@example.com' },
    });
  });

  it('returns an INVALID_INPUT response for malformed JSON', async () => {
    const request = new Request('http://localhost/api/groups', {
      method: 'POST',
      body: '{',
    });

    const result = await readJsonBody(request, createInviteBodySchema);

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Request body must be valid JSON',
      },
    });
  });

  it('returns a useful validation message for invalid JSON shapes', async () => {
    const request = new Request('http://localhost/api/groups', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
    });

    const result = await readJsonBody(request, createInviteBodySchema);

    expect(result.success).toBe(false);
    if (result.success) return;

    const body = await result.response.json();
    expect(body.error.code).toBe('INVALID_INPUT');
    expect(body.error.message).toMatch(/email/i);
  });

  it('accepts an empty request body when the route opts in', async () => {
    const request = new Request('http://localhost/api/groups', {
      method: 'POST',
    });

    const result = await readJsonBody(request, createInviteBodySchema, {
      allowEmpty: true,
    });

    expect(result).toEqual({ success: true, data: {} });
  });

  it('parses query numbers and rejects non-integer pagination values', () => {
    const validRequest = new Request(
      'http://localhost/api/groups/group-1/expenses?limit=25&minAmountCents=0'
    );
    const validResult = readSearchParams(
      validRequest,
      expenseListQuerySchema
    );

    expect(validResult).toEqual({
      success: true,
      data: { limit: 25, minAmountCents: 0 },
    });

    const invalidRequest = new Request(
      'http://localhost/api/groups/group-1/expenses?limit=1.5'
    );
    const invalidResult = readSearchParams(
      invalidRequest,
      expenseListQuerySchema
    );

    expect(invalidResult.success).toBe(false);
    if (invalidResult.success) return;
    expect(invalidResult.response.status).toBe(400);
  });
});
