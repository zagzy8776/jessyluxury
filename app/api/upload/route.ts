import { NextResponse } from 'next/server'
import { requireStaffAuthOr } from '@/lib/staff-auth'

const MAX_FILE_SIZE = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function POST(request: Request) {
  const authErr = await requireStaffAuthOr(request, ['products', 'catalog', 'settings', 'marketing'])
  if (authErr) return authErr

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Please select an image file' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, and WEBP images are supported' }, { status: 415 })
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Image must be larger than 0 bytes and no more than 8MB' }, { status: 413 })
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || cloudName === 'YOUR_CLOUD_NAME_HERE') {
      return NextResponse.json(
        { error: 'Cloudinary is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.' },
        { status: 503 }
      )
    }

    if (!uploadPreset || uploadPreset === 'YOUR_UPLOAD_PRESET_HERE') {
      return NextResponse.json(
        { error: 'Cloudinary upload preset is not configured.' },
        { status: 503 }
      )
    }

    const cloudinaryForm = new FormData()
    cloudinaryForm.append('file', file)
    cloudinaryForm.append('upload_preset', uploadPreset)
    cloudinaryForm.append('folder', 'jessy-luxury/products')

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: cloudinaryForm,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Cloudinary error:', err)
      return NextResponse.json({ error: 'Image upload failed. Please try again.' }, { status: 502 })
    }

    const data = await res.json()
    if (!data.secure_url) {
      return NextResponse.json({ error: 'Image provider returned no image URL' }, { status: 502 })
    }

    return NextResponse.json({ url: data.secure_url, publicId: data.public_id })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
