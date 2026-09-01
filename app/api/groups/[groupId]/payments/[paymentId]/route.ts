import { errorResponse, successResponse } from '@/lib/api/response';
import { getCurrentUser } from '@/lib/services/authService';
import { deleteSettlementPayment } from '@/lib/services/paymentService';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ groupId: string; paymentId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { groupId, paymentId } = await params;

    const result = await deleteSettlementPayment({
      groupId,
      paymentId,
      userId: currentUser.id,
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
