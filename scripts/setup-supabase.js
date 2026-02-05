import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function setupStorage() {
    console.log('Creating storage bucket: family-os...')
    const { data, error } = await supabase.storage.createBucket('family-os', {
        public: true
    })

    if (error) {
        if (error.message === 'Bucket already exists') {
            console.log('Bucket family-os already exists.')
        } else {
            console.error('Error creating bucket:', error)
        }
    } else {
        console.log('Bucket family-os created successfully.')
    }
}

setupStorage()
