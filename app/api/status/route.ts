import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://admin.sycord.com', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5-second timeout
    })

    if (response.ok) {
      return NextResponse.json({ status: 'available' })
    } else if (response.status === 502) {
      return NextResponse.json({ status: 'server_down' })
    } else {
      return NextResponse.json({ status: 'unavailable' })
    }
  } catch (error) {
    return NextResponse.json({ status: 'unavailable' })
  }
}
