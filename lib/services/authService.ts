import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

import { generateToken, verifyToken } from '@/lib/utils/jwt';
import {
  createUserByEmail,
  deleteUserById,
  getUserByEmail,
  getUserById,
  getUserByName,
  updateUserById,
} from '@/lib/repositories/userRepository';

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; status: number } };

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

export async function registerUser({
  name,
  email,
  password,
}: RegisterInput): Promise<
  AuthResult<{ user: { id: string; name: string; email: string } }>
> {
  if (!name || !email || !password) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Name, email and password are required',
        status: 400,
      },
    };
  }

  if (password.length < 6) {
    return {
      ok: false,
      error: {
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters',
        status: 400,
      },
    };
  }

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return {
      ok: false,
      error: {
        code: 'EMAIL_IN_USE',
        message: 'Email already in use',
        status: 409,
      },
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUserByEmail({ name, email, passwordHash });

  return {
    ok: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  };
}

export async function loginUser({ email, password }: LoginInput): Promise<
  AuthResult<{
    user: { id: string; name: string; email: string };
    token: string;
  }>
> {
  if (!email || !password) {
    return {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Email and password are required',
        status: 400,
      },
    };
  }

  const user = await getUserByEmail(email);

  if (!user) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        status: 401,
      },
    };
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    return {
      ok: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        status: 401,
      },
    };
  }

  const token = generateToken(user.id);

  return {
    ok: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    },
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);
    const user = await getUserById(payload.userId);

    if (!user) {
      return null;
    }

    const { passwordHash, ...safeUser } = user;

    return safeUser;
  } catch {
    return null;
  }
}

export async function deleteUserAccount(
  currentUserId: string | null,
  targetUserId: string | null
): Promise<AuthResult<{ deleted: true }>> {
  if (!currentUserId) {
    return {
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        status: 401,
      },
    };
  }

  if (!targetUserId || currentUserId !== targetUserId) {
    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You can only delete your own account',
        status: 403,
      },
    };
  }

  const deleted = await deleteUserById(targetUserId);

  if (!deleted) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
        status: 404,
      },
    };
  }

  return {
    ok: true,
    data: { deleted: true },
  };
}

export async function updateUserAccount(
  currentUserId: string | null,
  updates: { email?: string; name?: string; password?: string }
): Promise<AuthResult<{ id: string; name: string; email: string }>> {
  if (!currentUserId) {
    return {
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        status: 401,
      },
    };
  }

  const user = await getUserById(currentUserId);

  if (!user) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
        status: 404,
      },
    };
  }

  if (!updates.email && !updates.name) {
    return {
      ok: false,
      error: {
        code: 'NO_UPDATES_PROVIDED',
        message: 'No updates provided',
        status: 400,
      },
    };
  }

  const isSamePassword = updates.password
    ? await bcrypt.compare(updates.password, user.passwordHash)
    : false;

  if (!isSamePassword) {
    return {
      ok: false,
      error: {
        code: 'INVALID_PASSWORD',
        message: 'Current password is incorrect',
        status: 400,
      },
    };
  }

  if (updates.email) {
    const existingUser = await getUserByEmail(updates.email);
    if (existingUser && existingUser.id !== currentUserId) {
      return {
        ok: false,
        error: {
          code: 'EMAIL_IN_USE',
          message: 'Email already in use',
          status: 409,
        },
      };
    }
  }

  if (updates.name) {
    const existingUser = await getUserByName(updates.name);
    if (existingUser && existingUser.id !== currentUserId) {
      return {
        ok: false,
        error: {
          code: 'NAME_IN_USE',
          message: 'Name already in use',
          status: 409,
        },
      };
    }
  }

  const updatedUser = await updateUserById(currentUserId, {
    email: updates.email ?? user.email,
    name: updates.name ?? user.name,
  });

  if (
    !updatedUser ||
    !updatedUser.id ||
    !updatedUser.name ||
    !updatedUser.email
  ) {
    return {
      ok: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update user',
        status: 500,
      },
    };
  }

  return {
    ok: true,
    data: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
    },
  };
}
