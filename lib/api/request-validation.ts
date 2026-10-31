import { z, type ZodType } from 'zod';

import { errorResponse } from '@/lib/api/response';

export type RequestValidation<T> =
  | { success: true; data: T }
  | { success: false; response: ReturnType<typeof errorResponse> };

function validationError(message: string): RequestValidation<never> {
  return {
    success: false,
    response: errorResponse('INVALID_INPUT', message, 400),
  };
}

function validate<T>(input: unknown, schema: ZodType<T>): RequestValidation<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join('.');
    const message = issue?.message ?? 'Request is invalid';

    return validationError(path ? `${path}: ${message}` : message);
  }

  return { success: true, data: parsed.data };
}

export async function readJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
  options: { allowEmpty?: boolean } = {}
): Promise<RequestValidation<T>> {
  const rawBody = await request.text();
  if (!rawBody.trim() && options.allowEmpty) {
    return validate({}, schema);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return validationError('Request body must be valid JSON');
  }

  return validate(body, schema);
}

export function readSearchParams<T>(
  request: Request,
  schema: ZodType<T>
): RequestValidation<T> {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  return validate(params, schema);
}

const nonEmptyString = z.string().min(1);
const optionalString = z.string().optional();
const optionalNonEmptyString = nonEmptyString.optional();
const optionalQueryString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  optionalString
);
const password = nonEmptyString;

const splitSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('equal') }),
  z.object({
    mode: z.literal('selected'),
    participantIds: z.array(nonEmptyString),
  }),
  z.object({
    mode: z.literal('percentage'),
    shares: z.array(
      z.object({
        participantId: nonEmptyString,
        percentage: z.number().finite(),
      })
    ),
  }),
]);

export const registerBodySchema = z.object({
  name: nonEmptyString,
  email: z.string().email(),
  password,
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password,
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().email(),
});

export const resetPasswordBodySchema = z.object({
  token: nonEmptyString,
  password,
});

export const updateUserBodySchema = z.object({
  email: z.string().email().optional(),
  name: optionalNonEmptyString,
  password: optionalString,
});

export const createGroupBodySchema = z.object({
  name: nonEmptyString,
  description: optionalString,
});

export const leaveGroupBodySchema = z.object({
  groupId: nonEmptyString,
});

export const updateGroupBodySchema = z.object({
  name: nonEmptyString,
  description: optionalString,
});

export const addParticipantBodySchema = z.object({
  displayName: nonEmptyString,
  userId: optionalNonEmptyString,
  role: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
  status: z.enum(['active', 'invited', 'left']).optional(),
});

export const updateParticipantBodySchema = z.object({
  displayName: optionalNonEmptyString,
  role: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
  status: z.enum(['active', 'invited', 'left']).optional(),
});

export const createExpenseBodySchema = z.object({
  title: nonEmptyString,
  description: optionalString,
  category: nonEmptyString,
  amount: z.number().int().positive(),
  currency: nonEmptyString,
  paidByParticipantId: nonEmptyString,
  split: splitSchema,
});

export const updateExpenseBodySchema = z.object({
  title: optionalNonEmptyString,
  description: optionalString,
  amount: z.number().int().positive().optional(),
  currency: optionalNonEmptyString,
  paidByParticipantId: optionalNonEmptyString,
  category: optionalNonEmptyString,
  split: splitSchema.optional(),
});

function optionalQueryInteger(minimum: number, maximum?: number) {
  const numberSchema = z.number().finite().int().min(minimum);

  return z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : Number(value)),
    (maximum === undefined ? numberSchema : numberSchema.max(maximum)).optional()
  );
}

export const expenseListQuerySchema = z.object({
  limit: optionalQueryInteger(1, 100),
  cursor: optionalQueryString,
  category: optionalQueryString,
  dateFrom: optionalQueryString,
  dateTo: optionalQueryString,
  minAmountCents: optionalQueryInteger(0),
  maxAmountCents: optionalQueryInteger(0),
  search: optionalQueryString,
});

export const createPaymentBodySchema = z.object({
  fromParticipantId: nonEmptyString,
  toParticipantId: nonEmptyString,
  amountCents: z.number().int().positive(),
  currency: nonEmptyString,
});

export const paymentListQuerySchema = z.object({
  currency: optionalQueryString,
  limit: optionalQueryInteger(1, 50),
  cursor: optionalQueryString,
});

export const createInviteBodySchema = z.object({
  email: z.string().email().optional(),
});

export const acceptInviteBodySchema = z
  .object({
    participantId: optionalNonEmptyString,
    displayName: optionalNonEmptyString,
  })
  .refine(
    (body) =>
      Number(body.participantId !== undefined) +
        Number(body.displayName !== undefined) ===
      1,
    { message: 'Provide either participantId or displayName' }
  );

export const categoryStatsQuerySchema = z.object({
  currency: nonEmptyString,
  dateFrom: optionalQueryString,
  dateTo: optionalQueryString,
});

const httpsUrl = z
  .string()
  .url()
  .refine((value) => value.startsWith('https://'), {
    message: 'Expected an HTTPS URL',
  });

export const pushSubscriptionBodySchema = z.object({
  endpoint: httpsUrl,
  keys: z.object({
    p256dh: nonEmptyString,
    auth: nonEmptyString,
  }),
});

export const deletePushSubscriptionBodySchema = z.object({
  endpoint: httpsUrl,
});
