/**
 * Standard fetch-based integration clients for Resend and OneSignal.
 * Designed to prevent external library bloating and ensure lightweight serverless deployment.
 */

export interface ResendResponse {
  id: string
}

export interface OneSignalResponse {
  id: string
}

export async function sendResendEmail(to: string, subject: string, html: string): Promise<ResendResponse> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Jessy Luxury <orders@jessyluxury.com>',
      to: [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Resend API Error (${response.status}): ${errText}`)
  }

  const data = await response.json()
  return { id: data.id || 'resend-ok' }
}

export async function sendOneSignalPush(recipientId: string, title: string, message: string, customData?: any): Promise<OneSignalResponse> {
  const appId = process.env.ONESIGNAL_APP_ID
  const apiKey = process.env.ONESIGNAL_API_KEY
  if (!appId || !apiKey) {
    throw new Error('ONESIGNAL_APP_ID or ONESIGNAL_API_KEY is not configured')
  }

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      include_aliases: {
        external_id: [String(recipientId)],
      },
      target_channel: 'push',
      headings: { en: title },
      contents: { en: message },
      data: customData || {},
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OneSignal API Error (${response.status}): ${errText}`)
  }

  const data = await response.json()
  return { id: data.id || 'onesignal-ok' }
}

export async function broadcastOneSignalPush(title: string, message: string, customUrl?: string): Promise<OneSignalResponse> {
  const appId = process.env.ONESIGNAL_APP_ID
  const apiKey = process.env.ONESIGNAL_API_KEY
  if (!appId || !apiKey) {
    throw new Error('ONESIGNAL_APP_ID or ONESIGNAL_API_KEY is not configured')
  }

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      included_segments: ['Subscribed Users'],
      target_channel: 'push',
      headings: { en: title },
      contents: { en: message },
      url: customUrl || undefined,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OneSignal API Error (${response.status}): ${errText}`)
  }

  const data = await response.json()
  return { id: data.id || 'onesignal-ok' }
}

