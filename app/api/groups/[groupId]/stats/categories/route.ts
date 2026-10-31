import { errorResponse, successResponse } from '@/lib/api/response';
import {
  categoryStatsQuerySchema,
  readSearchParams,
} from '@/lib/api/request-validation';
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
    const query = readSearchParams(req, categoryStatsQuerySchema);
    if (!query.success) {
      return query.response;
    }

    const result = await getGroupCategoryStats({
      groupId,
      userId: currentUser.id,
      currency: query.data.currency,
      dateFrom: query.data.dateFrom,
      dateTo: query.data.dateTo,
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
