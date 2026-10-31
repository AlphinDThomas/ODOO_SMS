import { adminAuthClient } from '../config/supabase.js';
import { prisma } from '../config/prisma.js';

const USERS = [
  {
    email: 'admin@brightloop.com',
    password: 'Admin@Brightloop123',
    fullName: 'System Administrator',
    role: 'ADMIN',
  },
  {
    email: 'staff@brightloop.com',
    password: 'Staff@Brightloop123',
    fullName: 'Internal Staff',
    role: 'STAFF',
  },
  {
    email: 'customer@brightloop.com',
    password: 'Customer@Brightloop123',
    fullName: 'Acme Business Admin',
    role: 'CUSTOMER',
    companyName: 'Acme Technologies Pvt Ltd',
  },
];

async function seed() {
  console.log('Seeding login accounts...');

  for (const u of USERS) {
    try {
      // 1. Create or get user in Supabase Auth
      let authUser;
      const { data: listData } = await adminAuthClient.auth.admin.listUsers();
      const existing = listData?.users?.find(
        (item) => item.email?.toLowerCase() === u.email.toLowerCase(),
      );

      if (existing) {
        // Update password & confirm
        const { data: updated, error: updateErr } = await adminAuthClient.auth.admin.updateUserById(
          existing.id,
          {
            password: u.password,
            email_confirm: true,
            user_metadata: { fullName: u.fullName },
          },
        );
        if (updateErr) throw updateErr;
        authUser = updated.user;
        console.log(`Updated existing auth user: ${u.email}`);
      } else {
        const { data: created, error: createErr } = await adminAuthClient.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { fullName: u.fullName },
        });
        if (createErr) throw createErr;
        authUser = created.user;
        console.log(`Created new auth user: ${u.email}`);
      }

      // 2. Upsert UserProfile in PostgreSQL
      const profile = await prisma.userProfile.upsert({
        where: { id: authUser.id },
        update: {
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          isActive: true,
        },
        create: {
          id: authUser.id,
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          isActive: true,
        },
      });

      // 3. If Customer, create Customer company record
      if (u.role === 'CUSTOMER') {
        await prisma.customer.upsert({
          where: { userId: profile.id },
          update: {
            companyName: u.companyName,
            billingEmail: u.email,
          },
          create: {
            userId: profile.id,
            companyName: u.companyName,
            billingEmail: u.email,
            phone: '+1 555-0199',
            addressLine1: '123 Market Street',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'USA',
          },
        });
        console.log(`Linked Customer profile for: ${u.companyName}`);
      }

      console.log(`✓ [${u.role}] ready: ${u.email}`);
    } catch (err) {
      console.error(`Failed to seed ${u.email}:`, err.message);
    }
  }

  await prisma.$disconnect();
  console.log('Seeding finished successfully!');
}

seed();
