import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { errorResponse, successResponse } from '@/lib/api/response';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return errorResponse(
      'UNAUTHORIZED',
      'Authentication required',
      401
    );
  }

  return successResponse(user);
}