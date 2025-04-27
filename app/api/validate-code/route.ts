import { NextResponse } from 'next/server'
import { validateTableCode } from '@/lib/data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  try {
    const tableNumber = await validateTableCode(code)
    
    if (!tableNumber) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
    }

    return NextResponse.json({ table_number: tableNumber })
  } catch (error) {
    console.error('Error validating code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 