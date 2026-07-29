import { NextRequest, NextResponse } from 'next/server'
import { searchUsers } from '@/lib/tiktok'
import { ApiErrorResponse } from '@/types'

type ApiCode = ApiErrorResponse['code']

const CODE_TO_HTTP: Record<ApiCode, { status: number; message: string }> = {
  INVALID_USERNAME: { status: 400, message: '请输入搜索关键词' },
  USER_NOT_FOUND: { status: 404, message: '未找到相关账号' },
  RATE_LIMIT: { status: 429, message: 'API 速率受限，请稍后再试' },
  MISSING_API_KEY: { status: 503, message: '服务器缺少 RAPIDAPI_KEY 配置' },
  NETWORK_ERROR: { status: 502, message: '无法连接 TikTok 数据服务' },
  API_ERROR: { status: 500, message: '搜索服务暂时不可用' },
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const keywords = searchParams.get('q') || searchParams.get('keywords') || ''
    const count = Math.min(parseInt(searchParams.get('count') || '10', 10) || 10, 30)

    if (!keywords.trim()) {
      return NextResponse.json<ApiErrorResponse>(
        { error: '请输入搜索关键词', code: 'INVALID_USERNAME' },
        { status: 400 }
      )
    }

    const results = await searchUsers(keywords, count)
    return NextResponse.json({ results })
  } catch (err) {
    const code: ApiCode = (err && typeof err === 'object' && 'code' in err)
      ? (err as { code: ApiCode }).code
      : 'API_ERROR'
    const detail = err instanceof Error ? err.message : String(err)
    const mapping = CODE_TO_HTTP[code] || CODE_TO_HTTP.API_ERROR

    console.error(`[search] ${code}:`, detail)
    return NextResponse.json<ApiErrorResponse>(
      { error: mapping.message, code, ...(code === 'API_ERROR' ? { detail } : {}) },
      { status: mapping.status }
    )
  }
}
