import { PrismaClient, StaffRole, ParcelType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Seeding CDG Global Logistics database...\n');

  // ─── Branches (Operational Terminals) ────────────────────────────────────
  console.log('Creating branches...');
  const branches = await Promise.all([
    // Greater Accra
    prisma.branch.upsert({
      where: { code: 'ACC-CIR' },
      update: { name: 'Accra Circle – Neoplan Station', zone: 'Greater Accra', address: 'Accra Circle – Neoplan Station, Accra' },
      create: { name: 'Accra Circle – Neoplan Station', code: 'ACC-CIR', zone: 'Greater Accra', address: 'Accra Circle – Neoplan Station, Accra' },
    }),
    // Ashanti
    prisma.branch.upsert({
      where: { code: 'KSI-LBR' },
      update: { name: 'Kumasi Labor Roundabout', zone: 'Ashanti', address: 'Labor Roundabout, Kumasi' },
      create: { name: 'Kumasi Labor Roundabout', code: 'KSI-LBR', zone: 'Ashanti', address: 'Labor Roundabout, Kumasi' },
    }),
    prisma.branch.upsert({
      where: { code: 'KSI-ABK' },
      update: { name: 'Kumasi Abuakwa', zone: 'Ashanti', address: 'Abuakwa, Kumasi' },
      create: { name: 'Kumasi Abuakwa', code: 'KSI-ABK', zone: 'Ashanti', address: 'Abuakwa, Kumasi' },
    }),
    prisma.branch.upsert({
      where: { code: 'KSI-KNS' },
      update: { name: 'KNUST Kumasi Campus', zone: 'Ashanti', address: 'KNUST Campus, Kumasi' },
      create: { name: 'KNUST Kumasi Campus', code: 'KSI-KNS', zone: 'Ashanti', address: 'KNUST Campus, Kumasi' },
    }),
    // Northern
    prisma.branch.upsert({
      where: { code: 'TML-UDS' },
      update: { name: 'Tamale UDS Entrance', zone: 'Northern', address: 'UDS Entrance, Tamale' },
      create: { name: 'Tamale UDS Entrance', code: 'TML-UDS', zone: 'Northern', address: 'UDS Entrance, Tamale' },
    }),
    prisma.branch.upsert({
      where: { code: 'TML-GOL' },
      update: { name: 'Tamale GOIL Filling Station', zone: 'Northern', address: 'GOIL Filling Station, Tamale' },
      create: { name: 'Tamale GOIL Filling Station', code: 'TML-GOL', zone: 'Northern', address: 'GOIL Filling Station, Tamale' },
    }),
    // Upper West
    prisma.branch.upsert({
      where: { code: 'WA-JUB' },
      update: { name: 'Wa Jubilee Park', zone: 'Upper West', address: 'Jubilee Park, Wa' },
      create: { name: 'Wa Jubilee Park', code: 'WA-JUB', zone: 'Upper West', address: 'Jubilee Park, Wa' },
    }),
    // Upper East
    prisma.branch.upsert({
      where: { code: 'BLG-GOL' },
      update: { name: 'Bolgatanga GOIL Filling Station', zone: 'Upper East', address: 'GOIL Filling Station, Bolgatanga' },
      create: { name: 'Bolgatanga GOIL Filling Station', code: 'BLG-GOL', zone: 'Upper East', address: 'GOIL Filling Station, Bolgatanga' },
    }),
    prisma.branch.upsert({
      where: { code: 'BLG-MAN' },
      update: { name: 'Bolgatanga Main Station', zone: 'Upper East', address: 'Main Station, Bolgatanga' },
      create: { name: 'Bolgatanga Main Station', code: 'BLG-MAN', zone: 'Upper East', address: 'Main Station, Bolgatanga' },
    }),
    prisma.branch.upsert({
      where: { code: 'BLG-PET' },
      update: { name: 'Bolgatanga Petrosol', zone: 'Upper East', address: 'Petrosol Station, Bolgatanga' },
      create: { name: 'Bolgatanga Petrosol', code: 'BLG-PET', zone: 'Upper East', address: 'Petrosol Station, Bolgatanga' },
    }),
    // Bono
    prisma.branch.upsert({
      where: { code: 'SUN-CGO' },
      update: { name: 'Sunyani Cargo Station (Wednesday Market)', zone: 'Bono', address: 'Cargo Station – Wednesday Market, Sunyani' },
      create: { name: 'Sunyani Cargo Station (Wednesday Market)', code: 'SUN-CGO', zone: 'Bono', address: 'Cargo Station – Wednesday Market, Sunyani' },
    }),
    prisma.branch.upsert({
      where: { code: 'TCH-MAN' },
      update: { name: 'Techiman Main Station', zone: 'Bono', address: 'Main Station, Techiman' },
      create: { name: 'Techiman Main Station', code: 'TCH-MAN', zone: 'Bono', address: 'Main Station, Techiman' },
    }),
    // Upper East (Bongo)
    prisma.branch.upsert({
      where: { code: 'BGO-SOE' },
      update: { name: 'Bongo Soe Cuando Station', zone: 'Upper East', address: 'Soe Cuando Station, Bongo' },
      create: { name: 'Bongo Soe Cuando Station', code: 'BGO-SOE', zone: 'Upper East', address: 'Soe Cuando Station, Bongo' },
    }),
    // Upper East (Zebila)
    prisma.branch.upsert({
      where: { code: 'ZEB-MAN' },
      update: { name: 'Zebila – Adjacent the District Police Station', zone: 'Upper East', address: 'Adjacent District Police Station, Zebila' },
      create: { name: 'Zebila – Adjacent the District Police Station', code: 'ZEB-MAN', zone: 'Upper East', address: 'Adjacent District Police Station, Zebila' },
    }),
    // Central
    prisma.branch.upsert({
      where: { code: 'KSO-MAN' },
      update: { name: 'Kasoa Main Station', zone: 'Central', address: 'Main Station, Kasoa' },
      create: { name: 'Kasoa Main Station', code: 'KSO-MAN', zone: 'Central', address: 'Main Station, Kasoa' },
    }),
    prisma.branch.upsert({
      where: { code: 'WIN-KJB' },
      update: { name: 'Winneba Kojo Badu Community Center', zone: 'Central', address: 'Kojo Badu Community Center, Winneba' },
      create: { name: 'Winneba Kojo Badu Community Center', code: 'WIN-KJB', zone: 'Central', address: 'Kojo Badu Community Center, Winneba' },
    }),
    // Western
    prisma.branch.upsert({
      where: { code: 'TKD-BAK' },
      update: { name: 'Sekondi-Takoradi – Bakagyir Opposite Silver FM', zone: 'Western', address: 'Bakagyir Opposite Silver FM, Sekondi-Takoradi' },
      create: { name: 'Sekondi-Takoradi – Bakagyir Opposite Silver FM', code: 'TKD-BAK', zone: 'Western', address: 'Bakagyir Opposite Silver FM, Sekondi-Takoradi' },
    }),
  ]);

  const accra    = branches[0];  // ACC-CIR
  const kumasi   = branches[1];  // KSI-LBR
  const takoradi = branches[16]; // TKD-BAK
  console.log(`  ✓ ${branches.length} branches created/updated\n`);

  // ─── IT Admin (system owner) ─────────────────────────────────────────────
  console.log('Creating staff...');
  const itAdmin = await prisma.staff.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      staffCode: 'ADM-0001',
      username: 'admin',
      passwordHash: await bcrypt.hash('Admin@CDG2026!', SALT_ROUNDS),
      fullName: 'System Administrator',
      role: StaffRole.IT_ADMIN,
      branchId: accra.id,
    },
  });

  // ─── Finance Admin ────────────────────────────────────────────────────────
  const financeAdmin = await prisma.staff.upsert({
    where: { username: 'finance.admin' },
    update: {},
    create: {
      staffCode: 'FIN-0001',
      username: 'finance.admin',
      passwordHash: await bcrypt.hash('Finance@CDG2026!', SALT_ROUNDS),
      fullName: 'Ama Owusu',
      role: StaffRole.FINANCE_ADMIN,
      branchId: accra.id,
    },
  });

  // ─── Branch Managers ──────────────────────────────────────────────────────
  await prisma.staff.upsert({
    where: { username: 'kofi.manager' },
    update: {},
    create: {
      staffCode: 'MGR-ACC-001',
      username: 'kofi.manager',
      passwordHash: await bcrypt.hash('Manager@CDG2026!', SALT_ROUNDS),
      fullName: 'Kofi Mensah',
      role: StaffRole.BRANCH_MANAGER,
      branchId: accra.id,
    },
  });

  await prisma.staff.upsert({
    where: { username: 'abena.manager' },
    update: {},
    create: {
      staffCode: 'MGR-KSI-001',
      username: 'abena.manager',
      passwordHash: await bcrypt.hash('Manager@CDG2026!', SALT_ROUNDS),
      fullName: 'Abena Frimpong',
      role: StaffRole.BRANCH_MANAGER,
      branchId: kumasi.id,
    },
  });

  // ─── Terminal Staff ───────────────────────────────────────────────────────
  const staffMembers = await Promise.all([
    prisma.staff.upsert({
      where: { username: 'kweku.staff' },
      update: {},
      create: {
        staffCode: 'STF-ACC-001',
        username: 'kweku.staff',
        passwordHash: await bcrypt.hash('Staff@CDG2026!', SALT_ROUNDS),
        fullName: 'Kweku Asante',
        role: StaffRole.TERMINAL_STAFF,
        branchId: accra.id,
        terminalNumber: 'T-01',
      },
    }),
    prisma.staff.upsert({
      where: { username: 'efua.staff' },
      update: {},
      create: {
        staffCode: 'STF-ACC-002',
        username: 'efua.staff',
        passwordHash: await bcrypt.hash('Staff@CDG2026!', SALT_ROUNDS),
        fullName: 'Efua Mensah',
        role: StaffRole.TERMINAL_STAFF,
        branchId: accra.id,
        terminalNumber: 'T-02',
      },
    }),
    prisma.staff.upsert({
      where: { username: 'yaw.staff' },
      update: {},
      create: {
        staffCode: 'STF-KSI-001',
        username: 'yaw.staff',
        passwordHash: await bcrypt.hash('Staff@CDG2026!', SALT_ROUNDS),
        fullName: 'Yaw Darko',
        role: StaffRole.TERMINAL_STAFF,
        branchId: kumasi.id,
        terminalNumber: 'T-01',
      },
    }),
    prisma.staff.upsert({
      where: { username: 'akosua.staff' },
      update: {},
      create: {
        staffCode: 'STF-TKD-001',
        username: 'akosua.staff',
        passwordHash: await bcrypt.hash('Staff@CDG2026!', SALT_ROUNDS),
        fullName: 'Akosua Boateng',
        role: StaffRole.TERMINAL_STAFF,
        branchId: takoradi.id,
        terminalNumber: 'T-01',
      },
    }),
  ]);

  const totalStaff = 2 + 2 + staffMembers.length;
  console.log(`  ✓ ${totalStaff} staff members created\n`);

  // ─── Fee Rules ────────────────────────────────────────────────────────────
  console.log('Creating fee rules...');
  const effectiveFrom = new Date('2026-01-01');

  const feeMatrix: Array<{
    parcelType: ParcelType;
    destinationZone: string;
    minFee: number;
    standardFee: number;
  }> = [
    // GENERAL
    { parcelType: ParcelType.GENERAL, destinationZone: 'Greater Accra', minFee: 20,  standardFee: 28  },
    { parcelType: ParcelType.GENERAL, destinationZone: 'Ashanti',       minFee: 35,  standardFee: 45  },
    { parcelType: ParcelType.GENERAL, destinationZone: 'Western',       minFee: 38,  standardFee: 48  },
    { parcelType: ParcelType.GENERAL, destinationZone: 'Northern',      minFee: 55,  standardFee: 65  },
    { parcelType: ParcelType.GENERAL, destinationZone: 'Central',       minFee: 30,  standardFee: 38  },
    { parcelType: ParcelType.GENERAL, destinationZone: 'Volta',         minFee: 35,  standardFee: 42  },
    { parcelType: ParcelType.GENERAL, destinationZone: 'Bono',          minFee: 42,  standardFee: 52  },
    { parcelType: ParcelType.GENERAL, destinationZone: 'Upper East',    minFee: 60,  standardFee: 72  },
    { parcelType: ParcelType.GENERAL, destinationZone: 'Upper West',    minFee: 65,  standardFee: 78  },
    // DOCUMENT
    { parcelType: ParcelType.DOCUMENT, destinationZone: 'Greater Accra', minFee: 12, standardFee: 18  },
    { parcelType: ParcelType.DOCUMENT, destinationZone: 'Ashanti',       minFee: 20, standardFee: 28  },
    { parcelType: ParcelType.DOCUMENT, destinationZone: 'Western',       minFee: 22, standardFee: 30  },
    { parcelType: ParcelType.DOCUMENT, destinationZone: 'Northern',      minFee: 30, standardFee: 40  },
    { parcelType: ParcelType.DOCUMENT, destinationZone: 'Central',       minFee: 18, standardFee: 25  },
    { parcelType: ParcelType.DOCUMENT, destinationZone: 'Volta',         minFee: 20, standardFee: 28  },
    { parcelType: ParcelType.DOCUMENT, destinationZone: 'Bono',          minFee: 25, standardFee: 33  },
    { parcelType: ParcelType.DOCUMENT, destinationZone: 'Upper East',    minFee: 35, standardFee: 45  },
    { parcelType: ParcelType.DOCUMENT, destinationZone: 'Upper West',    minFee: 38, standardFee: 48  },
    // FRAGILE
    { parcelType: ParcelType.FRAGILE, destinationZone: 'Greater Accra',  minFee: 35,  standardFee: 48  },
    { parcelType: ParcelType.FRAGILE, destinationZone: 'Ashanti',        minFee: 55,  standardFee: 70  },
    { parcelType: ParcelType.FRAGILE, destinationZone: 'Western',        minFee: 58,  standardFee: 75  },
    { parcelType: ParcelType.FRAGILE, destinationZone: 'Northern',       minFee: 80,  standardFee: 100 },
    { parcelType: ParcelType.FRAGILE, destinationZone: 'Central',        minFee: 48,  standardFee: 62  },
    { parcelType: ParcelType.FRAGILE, destinationZone: 'Volta',          minFee: 55,  standardFee: 70  },
    { parcelType: ParcelType.FRAGILE, destinationZone: 'Bono',           minFee: 65,  standardFee: 82  },
    { parcelType: ParcelType.FRAGILE, destinationZone: 'Upper East',     minFee: 90,  standardFee: 115 },
    { parcelType: ParcelType.FRAGILE, destinationZone: 'Upper West',     minFee: 95,  standardFee: 120 },
    // ELECTRONICS
    { parcelType: ParcelType.ELECTRONICS, destinationZone: 'Greater Accra', minFee: 40,  standardFee: 55  },
    { parcelType: ParcelType.ELECTRONICS, destinationZone: 'Ashanti',        minFee: 65,  standardFee: 85  },
    { parcelType: ParcelType.ELECTRONICS, destinationZone: 'Western',        minFee: 68,  standardFee: 88  },
    { parcelType: ParcelType.ELECTRONICS, destinationZone: 'Northern',       minFee: 95,  standardFee: 120 },
    { parcelType: ParcelType.ELECTRONICS, destinationZone: 'Central',        minFee: 58,  standardFee: 75  },
    { parcelType: ParcelType.ELECTRONICS, destinationZone: 'Volta',          minFee: 65,  standardFee: 85  },
    { parcelType: ParcelType.ELECTRONICS, destinationZone: 'Bono',           minFee: 75,  standardFee: 96  },
    { parcelType: ParcelType.ELECTRONICS, destinationZone: 'Upper East',     minFee: 110, standardFee: 140 },
    { parcelType: ParcelType.ELECTRONICS, destinationZone: 'Upper West',     minFee: 115, standardFee: 145 },
    // CLOTHING
    { parcelType: ParcelType.CLOTHING, destinationZone: 'Greater Accra',  minFee: 18, standardFee: 25  },
    { parcelType: ParcelType.CLOTHING, destinationZone: 'Ashanti',        minFee: 28, standardFee: 38  },
    { parcelType: ParcelType.CLOTHING, destinationZone: 'Western',        minFee: 30, standardFee: 40  },
    { parcelType: ParcelType.CLOTHING, destinationZone: 'Northern',       minFee: 45, standardFee: 58  },
    { parcelType: ParcelType.CLOTHING, destinationZone: 'Central',        minFee: 25, standardFee: 33  },
    { parcelType: ParcelType.CLOTHING, destinationZone: 'Volta',          minFee: 28, standardFee: 38  },
    { parcelType: ParcelType.CLOTHING, destinationZone: 'Bono',           minFee: 35, standardFee: 45  },
    { parcelType: ParcelType.CLOTHING, destinationZone: 'Upper East',     minFee: 52, standardFee: 66  },
    { parcelType: ParcelType.CLOTHING, destinationZone: 'Upper West',     minFee: 55, standardFee: 70  },
  ];

  let feeCount = 0;
  for (const fee of feeMatrix) {
    const existing = await prisma.feeRule.findFirst({
      where: { parcelType: fee.parcelType, destinationZone: fee.destinationZone, effectiveTo: null },
    });
    if (!existing) {
      await prisma.feeRule.create({
        data: { ...fee, effectiveFrom, effectiveTo: null, createdById: itAdmin.id, approvedById: financeAdmin.id },
      });
      feeCount++;
    }
  }
  console.log(`  ✓ ${feeCount} fee rules created (${feeMatrix.length - feeCount} already existed)\n`);

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log('✅ Seed complete!\n');
  console.log('Default login credentials:');
  console.log('  IT Admin      → username: admin           password: Admin@CDG2026!');
  console.log('  Finance Admin → username: finance.admin   password: Finance@CDG2026!');
  console.log('  Branch Mgr    → username: kofi.manager    password: Manager@CDG2026!');
  console.log('  Terminal Staff→ username: kweku.staff      password: Staff@CDG2026!');
  console.log('\n⚠️  Change all passwords before going to production!\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
