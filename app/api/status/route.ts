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
      // Use a short cache lifetime for status checks
      next: { revalidate: 30 },
    })

    if (!response.ok) {
      // If the request to Cronitor fails, we can't know the status.
      return NextResponse.json({ status: 'unavailable' })
    }

    const data = await response.json()

    // Based on Cronitor's likely API response, we check the 'passing' property.
    // `true` means the monitor is OK. `false` means it's failing.
    if (data.passing === true) {
      return NextResponse.json({ status: 'available' })
    } else if (data.passing === false) {
      return NextResponse.json({ status: 'server_down' })
    }

    // Fallback for any unexpected status from Cronitor.
    return NextResponse.json({ status: 'unavailable' })
  } catch (error) {
    // This catches network errors when trying to reach Cronitor.
    return NextResponse.json({ status: 'unavailable' })
  }
}
