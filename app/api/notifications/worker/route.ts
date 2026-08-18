import { NextResponse } from 'next/server'
import { processPendingDeliveries } from '@/lib/notifications/worker'
import { timingSafeEqual } from 'crypto'

function isAuthorized(request: Request): boolean {
  const incoming = request.headers.get('x-worker-secret') || ''
  const secret = process.env.WORKER_SECRET || 'secret'

  try {
    // Constant time string comparison to prevent timing side-channel attacks
    const incomingBuf = Buffer.from(incoming)
    const secretBuf = Buffer.from(secret)
    if (incomingBuf.length !== secretBuf.length) {
      return false
    }
    return timingSafeEqual(incomingBuf, secretBuf)
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stats = await processPendingDeliveries()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error running notification worker route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
