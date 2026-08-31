import { errorResponse, successResponse } from '@/lib/api/response';
import { getCurrentUser } from '@/lib/services/authService';
import { getGroupCategoryStats } from '@/lib/services/statsService';

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
    const currency = searchParams.get('currency');

    if (!currency) {
      return errorResponse('INVALID_INPUT', 'currency is required', 400);
    }

    const result = await getGroupCategoryStats({
      groupId,
      userId: currentUser.id,
      currency,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
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
