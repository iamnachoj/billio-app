import { errorResponse, successResponse } from '@/lib/api/response';
import { getCurrentUser } from '@/lib/services/authService';
import {
  deletePushSubscriptionByEndpoint,
  upsertPushSubscription,
} from '@/lib/repositories/pushSubscriptionRepository';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await req.json();
    const endpoint = body?.endpoint;
    const p256dh = body?.keys?.p256dh;
    const auth = body?.keys?.auth;

    if (
      typeof endpoint !== 'string' ||
      typeof p256dh !== 'string' ||
      typeof auth !== 'string' ||
      !endpoint.startsWith('https://')
    ) {
      return errorResponse('INVALID_INPUT', 'Invalid push subscription', 400);
    }

    await upsertPushSubscription({
      userId: currentUser.id,
      endpoint,
      p256dh,
      auth,
    });

    return successResponse({ subscribed: true }, 201);
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const body = await req.json();

    if (typeof body?.endpoint !== 'string') {
      return errorResponse('INVALID_INPUT', 'Endpoint is required', 400);
    }

    await deletePushSubscriptionByEndpoint(body.endpoint, currentUser.id);

    return successResponse({ subscribed: false });
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
