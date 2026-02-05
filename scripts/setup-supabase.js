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

async function setupBucket(bucketName) {
    console.log(`Setting up storage bucket: ${bucketName}...`)
    const { error } = await supabase.storage.createBucket(bucketName, {
        public: true
    })

    if (error) {
        if (error.message.includes('already exists')) {
            console.log(`Bucket ${bucketName} already exists.`)
        } else {
            console.error(`Error creating bucket ${bucketName}:`, error)
        }
    } else {
        console.log(`Bucket ${bucketName} created successfully.`)
    }
}

async function setupStorage() {
    await setupBucket('family-os');
    await setupBucket('avatar');
}

setupStorage()
