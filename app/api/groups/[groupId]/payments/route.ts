import { errorResponse, successResponse } from '@/lib/api/response';
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
    const body = await req.json();

    const result = await createSettlementPayment({
      groupId,
      userId: currentUser.id,
      fromParticipantId: body?.fromParticipantId,
      toParticipantId: body?.toParticipantId,
      amountCents: body?.amountCents,
      currency: body?.currency,
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
    const searchParams = new URL(req.url).searchParams;
    const limitParam = searchParams.get('limit');

    const result = await getGroupPayments({
      groupId,
      userId: currentUser.id,
      currency: searchParams.get('currency') ?? undefined,
      limit: limitParam ? Number(limitParam) : undefined,
      cursor: searchParams.get('cursor') ?? undefined,
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
