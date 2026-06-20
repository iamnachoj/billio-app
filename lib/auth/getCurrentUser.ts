import { cookies } from 'next/headers';

import { verifyToken } from './jwt';
import { getUserById } from '@/lib/repositories/userRepository';

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const token = cookieStore.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);

    const user = await getUserById(payload.userId);

    return user ?? null;
  } catch {
    return null;
  }
}
