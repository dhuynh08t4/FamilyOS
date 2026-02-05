import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YXNhc2pmdHJjbXVzYXhxenpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIzNjk4OCwiZXhwIjoyMDg1ODEyOTg4fQ.ycwHUYkrL6eTgx60eem9SrBsOK2q4u6hMkoQM62BErQ'

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
