import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seed skipped for now. To be implemented properly.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
