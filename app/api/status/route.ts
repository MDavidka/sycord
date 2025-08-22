import { NextResponse } from 'next/server'

const apiKey = '78cdb567ccc24c1891c1f43838e6b998'
const monitorKey = '8uNG0D'
const cronitorApiUrl = `https://cronitor.io/api/monitors/${monitorKey}`

export async function GET() {
  try {
    const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`

    const response = await fetch(cronitorApiUrl, {
      headers: {
        Authorization: authHeader,
      },
      next: { revalidate: 30 },
    })

    if (!response.ok) {
      return NextResponse.json({ status: 'unavailable' })
    }

    const data = await response.json()

    // Per user instruction, check the 'latest_event.event' field.
    if (data.latest_event && data.latest_event.event === 'req-ok') {
      return NextResponse.json({ status: 'available' })
    } else {
      // If the event is not 'req-ok' or the object is missing,
      // consider the server to be down.
      return NextResponse.json({ status: 'server_down' })
    }
  } catch (error) {
    return NextResponse.json({ status: 'unavailable' })
  }
}
