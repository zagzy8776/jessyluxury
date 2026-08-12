import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || cloudName === 'YOUR_CLOUD_NAME_HERE') {
      return NextResponse.json(
        { error: 'Cloudinary not configured yet. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to .env' },
        { status: 503 }
      )
    }

    const cloudinaryForm = new FormData()
    cloudinaryForm.append('file', file)
    cloudinaryForm.append('upload_preset', uploadPreset || 'ml_default')
    cloudinaryForm.append('folder', 'jessy-luxury/products')

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryForm,
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('Cloudinary error:', err)
      return NextResponse.json({ error: 'Upload failed', detail: err }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ url: data.secure_url, publicId: data.public_id })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
