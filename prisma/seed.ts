import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Matters ──────────────────────────────────────────────────────────────────
  const mattersData = [
    { code: 'DL', name: 'Demand Letter',     type: 'Civil',      price: 89.00,  description: 'Send a formal demand letter to resolve disputes.' },
    { code: 'CR', name: 'Contract Review',   type: 'Corporate',  price: 199.00, description: 'Have an attorney review your contract.' },
    { code: 'TR', name: 'Tenant Rights',     type: 'Civil',      price: 79.00,  description: 'Get help with landlord-tenant disputes.' },
    { code: 'EM', name: 'Employment',        type: 'Employment', price: 149.00, description: 'Handle workplace legal issues.' },
    { code: 'BF', name: 'Business Formation',type: 'Corporate',  price: 249.00, description: 'Form your business entity.' },
    { code: 'EP', name: 'Estate Planning',   type: 'Estate',     price: 179.00, description: 'Plan your estate and assets.' },
    { code: 'SC', name: 'Small Claims',      type: 'Civil',      price: 99.00,  description: 'Prepare your small claims case.' },
    { code: 'CD', name: 'Cease & Desist',    type: 'Civil',      price: 119.00, description: 'Stop harmful behavior with a cease and desist letter.' },
  ];

  for (const matter of mattersData) {
    await prisma.matter.upsert({
      where: { code: matter.code },
      update: { type: matter.type },
      create: matter,
    });
  }
  console.log('✓ Seeded 8 matters');

  // ── Specialities (aligned to matter types) ───────────────────────────────────
  // Each speciality maps to one or more matter codes
  const specialityMap: { name: string; codes: string[] }[] = [
    { name: 'Demand Letter',      codes: ['DL'] },
    { name: 'Contract Review',    codes: ['CR'] },
    { name: 'Tenant Rights',      codes: ['TR'] },
    { name: 'Employment Law',     codes: ['EM'] },
    { name: 'Business Formation', codes: ['BF'] },
    { name: 'Estate Planning',    codes: ['EP'] },
    { name: 'Small Claims',       codes: ['SC'] },
    { name: 'Cease & Desist',     codes: ['CD'] },
  ];

  for (const spec of specialityMap) {
    const speciality = await prisma.speciality.upsert({
      where: { name: spec.name },
      update: {},
      create: { name: spec.name },
    });

    for (const code of spec.codes) {
      const matter = await prisma.matter.findUnique({ where: { code } });
      if (!matter) continue;
      await prisma.matterSpeciality.upsert({
        where: { matter_id_speciality_id: { matter_id: matter.id, speciality_id: speciality.id } },
        update: {},
        create: { matter_id: matter.id, speciality_id: speciality.id },
      });
    }
  }
  console.log('✓ Seeded 8 specialities + matter links');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
