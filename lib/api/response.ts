import { NextResponse } from 'next/server';

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function errorResponse(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

export function unexpectedErrorResponse(error: unknown) {
  if (error instanceof Error && error.message.includes('GROUP_ARCHIVED')) {
    return errorResponse(
      'GROUP_ARCHIVED',
      'Group is archived and read-only',
      409
    );
  }
  console.error(error);
  return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
}
