#!/usr/bin/env node
/**
 * Script to create test users in Supabase for Netra AI
 * This script uses the Supabase Admin API to create users with proper roles
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

// Test users to create
const TEST_USERS = [
  {
    email: 'patient@test.com',
    password: 'patient123',
    role: 'patient',
    full_name: 'Test Patient',
  },
  {
    email: 'doctor@test.com',
    password: 'doctor123',
    role: 'doctor',
    full_name: 'Dr. Test Doctor',
  },
  {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
    full_name: 'Admin User',
  },
];

async function createUser(email, password, role, full_name) {
  try {
    console.log(`Creating ${role} user: ${email}...`);
    
    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: role,
        full_name: full_name,
      }
    });
    
    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        console.log(`  ⚠️  User already exists: ${email}`);
        return true;
      }
      throw error;
    }
    
    if (data.user) {
      const user_id = data.user.id;
      console.log(`  ✅ User created with ID: ${user_id}`);
      
      // Create profile in appropriate table
      if (role === 'patient') {
        const profile_data = {
          id: user_id,
          user_id: user_id,
          full_name: full_name,
          email: email,
        };
        await supabase.from('profiles_patient').insert(profile_data);
        console.log(`  ✅ Patient profile created`);
        
      } else if (role === 'doctor') {
        const profile_data = {
          id: user_id,
          user_id: user_id,
          full_name: full_name,
          email: email,
          specialization: 'General Medicine',
          verified: true, // Auto-verify for testing
        };
        await supabase.from('profiles_doctor').insert(profile_data);
        console.log(`  ✅ Doctor profile created`);
        
      } else if (role === 'admin') {
        // Admins typically use doctor profile table
        const profile_data = {
          id: user_id,
          user_id: user_id,
          full_name: full_name,
          email: email,
          specialization: 'Administration',
          verified: true,
        };
        await supabase.from('profiles_doctor').insert(profile_data);
        console.log(`  ✅ Admin profile created`);
      }
      
      return true;
    } else {
      console.log(`  ❌ Failed to create user`);
      return false;
    }
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Creating test users for Netra AI...\n');
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);
  
  let success_count = 0;
  for (const user of TEST_USERS) {
    if (await createUser(user.email, user.password, user.role, user.full_name)) {
      success_count++;
    }
    console.log();
  }
  
  console.log('='.repeat(60));
  console.log(`✅ Successfully created/verified ${success_count}/${TEST_USERS.length} users\n`);
  console.log('📝 Test User Credentials:');
  console.log('-'.repeat(60));
  for (const user of TEST_USERS) {
    console.log(`${user.role.toUpperCase().padEnd(8)} | Email: ${user.email.padEnd(25)} | Password: ${user.password}`);
  }
  console.log('-'.repeat(60));
  console.log('\n🌐 Login URLs:');
  console.log('  Patient: http://localhost:3000/login/patient');
  console.log('  Doctor:  http://localhost:3000/login/doctor');
  console.log('  Admin:   http://localhost:3000/login/admin');
  console.log('\n✅ You can now login with these credentials!');
}

main().catch(console.error);
