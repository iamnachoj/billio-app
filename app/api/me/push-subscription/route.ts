import { errorResponse, successResponse } from '@/lib/api/response';
import {
  deletePushSubscriptionBodySchema,
  pushSubscriptionBodySchema,
  readJsonBody,
} from '@/lib/api/request-validation';
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

    const body = await readJsonBody(req, pushSubscriptionBodySchema);
    if (!body.success) {
      return body.response;
    }

    await upsertPushSubscription({
      userId: currentUser.id,
      endpoint: body.data.endpoint,
      p256dh: body.data.keys.p256dh,
      auth: body.data.keys.auth,
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

    const body = await readJsonBody(req, deletePushSubscriptionBodySchema);
    if (!body.success) {
      return body.response;
    }

    await deletePushSubscriptionByEndpoint(body.data.endpoint, currentUser.id);

    return successResponse({ subscribed: false });
  } catch (error) {
    console.error(error);

    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
