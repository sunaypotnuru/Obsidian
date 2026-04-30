#!/usr/bin/env node
/**
 * Script to update existing Supabase users with proper role metadata
 * This will add/update the 'role' field in user_metadata for existing users
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Email to role mapping based on your screenshot
const USER_ROLES = {
  "rohithpanduru8@gmail.com": "doctor",
  "sunaypotnuru@gmail.com": "admin",
  "sunaysujsy@gmail.com": "patient",
};

async function updateUserRole(email, role) {
  try {
    console.log(`Updating ${email} with role: ${role}...`);
    
    // Get all users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) throw listError;
    
    // Find user by email
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.log(`  ⚠️  User not found: ${email}`);
      return false;
    }
    
    const user_id = user.id;
    
    // Update user metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user_id,
      {
        user_metadata: {
          role: role,
        }
      }
    );
    
    if (updateError) throw updateError;
    
    console.log(`  ✅ Updated user ${email} (ID: ${user_id}) with role: ${role}`);
    
    // Check if profile exists, create if not
    if (role === 'patient') {
      const { data: existing } = await supabase
        .from('profiles_patient')
        .select('id')
        .eq('id', user_id)
        .single();
      
      if (!existing) {
        const profile_data = {
          id: user_id,
          user_id: user_id,
          email: email,
        };
        await supabase.from('profiles_patient').insert(profile_data);
        console.log(`  ✅ Created patient profile`);
      } else {
        console.log(`  ℹ️  Patient profile already exists`);
      }
      
    } else if (role === 'doctor') {
      const { data: existing } = await supabase
        .from('profiles_doctor')
        .select('id')
        .eq('id', user_id)
        .single();
      
      if (!existing) {
        const profile_data = {
          id: user_id,
          user_id: user_id,
          email: email,
          specialization: 'General Medicine',
          verified: true,
        };
        await supabase.from('profiles_doctor').insert(profile_data);
        console.log(`  ✅ Created doctor profile`);
      } else {
        console.log(`  ℹ️  Doctor profile already exists`);
      }
      
    } else if (role === 'admin') {
      const { data: existing } = await supabase
        .from('profiles_doctor')
        .select('id')
        .eq('id', user_id)
        .single();
      
      if (!existing) {
        const profile_data = {
          id: user_id,
          user_id: user_id,
          email: email,
          specialization: 'Administration',
          verified: true,
        };
        await supabase.from('profiles_doctor').insert(profile_data);
        console.log(`  ✅ Created admin profile`);
      } else {
        console.log(`  ℹ️  Admin profile already exists`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔧 Updating user roles in Supabase...\n');
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);
  
  let success_count = 0;
  for (const [email, role] of Object.entries(USER_ROLES)) {
    if (await updateUserRole(email, role)) {
      success_count++;
    }
    console.log();
  }
  
  console.log('='.repeat(60));
  console.log(`✅ Successfully updated ${success_count}/${Object.keys(USER_ROLES).length} users\n`);
  console.log('📝 User Roles:');
  console.log('-'.repeat(60));
  for (const [email, role] of Object.entries(USER_ROLES)) {
    console.log(`${role.toUpperCase().padEnd(8)} | ${email}`);
  }
  console.log('-'.repeat(60));
  console.log('\n🌐 Login URLs:');
  console.log('  Patient: http://localhost:3000/login/patient');
  console.log('  Doctor:  http://localhost:3000/login/doctor');
  console.log('  Admin:   http://localhost:3000/login/admin');
  console.log('\n✅ Users are now ready to login!');
}

main().catch(console.error);
