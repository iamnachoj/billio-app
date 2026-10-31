import { errorResponse, successResponse } from '@/lib/api/response';
import {
  createPaymentBodySchema,
  paymentListQuerySchema,
  readJsonBody,
  readSearchParams,
} from '@/lib/api/request-validation';
import { getCurrentUser } from '@/lib/services/authService';
import {
  createSettlementPayment,
  getGroupPayments,
} from '@/lib/services/paymentService';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { groupId } = await params;
    const body = await readJsonBody(req, createPaymentBodySchema);
    if (!body.success) {
      return body.response;
    }

    const result = await createSettlementPayment({
      groupId,
      userId: currentUser.id,
      fromParticipantId: body.data.fromParticipantId,
      toParticipantId: body.data.toParticipantId,
      amountCents: body.data.amountCents,
      currency: body.data.currency,
    });

    if (!result.ok) {
      return errorResponse(
        result.error.code,
        result.error.message,
        result.error.status
      );
    }

    return successResponse(result.data, 201);
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { groupId } = await params;
    const query = readSearchParams(req, paymentListQuerySchema);
    if (!query.success) {
      return query.response;
    }

    const result = await getGroupPayments({
      groupId,
      userId: currentUser.id,
      currency: query.data.currency,
      limit: query.data.limit,
      cursor: query.data.cursor,
    });

    if (!result.ok) {
      return errorResponse(
        result.error.code,
        result.error.message,
        result.error.status
      );
    }

    return successResponse(result.data);
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
