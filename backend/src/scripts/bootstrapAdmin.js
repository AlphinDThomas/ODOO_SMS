import { adminAuthClient } from '../config/supabase.js';
import { prisma } from '../config/prisma.js';

const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || '').toLowerCase();
if (!email) {
  throw new Error('Set BOOTSTRAP_ADMIN_EMAIL to the Supabase Auth user you want as ADMIN');
}

const { data, error } = await adminAuthClient.auth.admin.listUsers();
if (error) throw error;

const user = data.users.find((item) => item.email?.toLowerCase() === email);
if (!user) {
  throw new Error(`No Auth user found for ${email}. Create the user in Supabase first.`);
}

const profile = await prisma.userProfile.upsert({
  where: { id: user.id },
  update: { role: 'ADMIN', email, isActive: true },
  create: {
    id: user.id,
    email,
    fullName: user.user_metadata?.fullName || 'Administrator',
    role: 'ADMIN',
  },
});

console.log(`Admin profile ready for ${profile.email}`);
await prisma.$disconnect();
