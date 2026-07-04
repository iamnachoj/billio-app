import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

type JwtPayload = {
  userId: string;
  iat: number;
  exp: number;
};

export function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '10d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
