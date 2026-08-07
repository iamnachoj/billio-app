type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type MeUser = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  avatarUrl?: string;
};

type UpdateMeInput = {
  name?: string;
  email?: string;
  password: string;
};

async function parseApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: {
        code: 'INVALID_RESPONSE',
        message: 'Unexpected response from server',
      },
    };
  }
}

export async function getMe() {
  const response = await fetch('/api/me', {
    credentials: 'include',
  });

  return parseApiResponse<MeUser>(response);
}

export async function updateMe(body: UpdateMeInput) {
  const response = await fetch('/api/me', {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseApiResponse<MeUser>(response);
}

export async function deleteMe() {
  const response = await fetch('/api/me', {
    method: 'DELETE',
    credentials: 'include',
  });

  return parseApiResponse<{ deleted: true }>(response);
}
