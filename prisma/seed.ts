import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const matters = [
    { code: 'DL', name: 'Demand Letter', price: 89.00, description: 'Send a formal demand letter to resolve disputes.' },
    { code: 'CR', name: 'Contract Review', price: 199.00, description: 'Have an attorney review your contract.' },
    { code: 'TR', name: 'Tenant Rights', price: 79.00, description: 'Get help with landlord-tenant disputes.' },
    { code: 'EM', name: 'Employment', price: 149.00, description: 'Handle workplace legal issues.' },
    { code: 'BF', name: 'Business Formation', price: 249.00, description: 'Form your business entity.' },
    { code: 'EP', name: 'Estate Planning', price: 179.00, description: 'Plan your estate and assets.' },
    { code: 'SC', name: 'Small Claims', price: 99.00, description: 'Prepare your small claims case.' },
    { code: 'CD', name: 'Cease & Desist', price: 119.00, description: 'Stop harmful behavior with a cease and desist letter.' },
  ];

  for (const matter of matters) {
    await prisma.matter.upsert({
      where: { code: matter.code },
      update: {},
      create: matter,
    });
  }

  console.log('Seeded 8 matters');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
