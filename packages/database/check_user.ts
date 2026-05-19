import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ where: { email: 'test@dyad.com' } });
  console.log('Users:', JSON.stringify(users, null, 2));
}
main().finally(() => prisma.$disconnect());
