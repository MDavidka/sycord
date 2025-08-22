import { NextResponse } from 'next/server'

// Keywords that are specific to Cloudflare error pages when the origin is down.
const cloudflareErrorKeywords = [
  'bad gateway',
  'error 502',
  'origin is unreachable',
  'host error',
]

export async function GET() {
  try {
    const response = await fetch('https://admin.sycord.com', {
      method: 'GET', // Use GET to retrieve page content
      signal: AbortSignal.timeout(5000),
    })

    const responseText = await response.text()
    const lowerCaseText = responseText.toLowerCase()

    // Check if the page content contains any of the Cloudflare error keywords.
    const isCloudflareError = cloudflareErrorKeywords.some(keyword =>
      lowerCaseText.includes(keyword)
    )

    if (isCloudflareError) {
      return NextResponse.json({ status: 'server_down' })
    }

    // If the response is ok and it's not a Cloudflare error page, the site is available.
    if (response.ok) {
      return NextResponse.json({ status: 'available' })
    }

    // For any other non-ok response, treat as a general issue.
    return NextResponse.json({ status: 'unavailable' })
  } catch (error) {
    // This catches network errors, timeouts, etc.
    return NextResponse.json({ status: 'unavailable' })
  }
}
