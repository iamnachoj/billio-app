const BASE_URL = '/api/auth';

export async function login(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return response.json();
}

export async function register(data: {
  name: string;
  email: string;
  password: string;
}) {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return response.json();
}

export async function requestPasswordReset(email: string) {
  const response = await fetch(`${BASE_URL}/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });

  return response.json();
}

export async function resetPassword({
  token,
  password,
}: {
  token: string;
  password: string;
}) {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      password,
    }),
  });

  return response.json();
}
