import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const users = [
    {
        email: 'dhuynh08t4@gmail.com',
        password: '1',
        full_name: 'Lê Đại Huỳnh',
        nice_name: 'Huỳnh',
        username: 'dhuynh08t4',
        role: 'admin'
    },

    {
        email: 'daihuynh510@gmail.com',
        password: '1',
        full_name: 'Lê Đại Huỳnh',
        nice_name: 'Huỳnh',
        username: 'daihuynh510',
        role: 'admin'
    },
    {
        email: 'minhtanh91@gmail.com',
        password: '1',
        full_name: 'Trần Thị Minh Tánh',
        nice_name: 'Tánh',
        username: 'minhtanh91',
        role: 'member'
    },
    {
        email: 'minhnhat@webviet.dev',
        password: '1',
        full_name: 'Lê Đại Minh Nhật',
        nice_name: 'Nhật',
        username: 'minhnhat',
        role: 'kid'
    },
    {
        email: 'nhatha@webviet.dev',
        password: '1',
        full_name: 'Lê Nhật Hạ',
        nice_name: 'Hạ',
        username: 'nhatha',
        role: 'kid'
    }
]

async function seedUsers() {
    for (const user of users) {
        console.log(`Checking user: ${user.email}...`)

        // 1. Create user in Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true
        })

        if (authError) {
            if (authError.message.includes('already registered')) {
                console.log(`User ${user.email} already exists in Auth.`)
                // Get user ID to update profile
                const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers();
                const found = existingUsers.find(u => u.email === user.email);
                if (found) await updateProfile(found.id, user);
            } else {
                console.error(`Error creating auth user ${user.email}:`, authError.message)
            }
        } else if (authData.user) {
            console.log(`User ${user.email} created in Auth.`)
            await updateProfile(authData.user.id, user);
        }
    }
}

async function updateProfile(id, user) {
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: id,
            full_name: user.full_name,
            nice_name: user.nice_name,
            username: user.username,
            role: user.role,
            updated_at: new Date().toISOString()
        })

    if (profileError) {
        console.error(`Error updating profile for ${user.email}:`, profileError.message)
    } else {
        console.log(`Profile for ${user.email} updated successfully.`)
    }
}

seedUsers()
