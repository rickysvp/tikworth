import jsPDF from 'jspdf'
import { Evaluation } from '@/types'

function formatUsd(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return '$' + Math.round(n)
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

export async function exportPdfReport(
  result: Evaluation,
  isUnlocked: boolean,
  _canvasElement: HTMLElement,
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  function addLine() {
    y += 2
    pdf.setDrawColor(60, 60, 60)
    pdf.line(margin, y, pageWidth - margin, y)
    y += 4
  }

  function checkPageBreak(needed: number) {
    if (y + needed > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage()
      y = margin
    }
  }

  // ===== Title =====
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  pdf.setTextColor('#00F2EA')
  pdf.text('TikWorth', margin, y)
  pdf.setFontSize(12)
  pdf.setTextColor('#888888')
  pdf.text('TikTok Account Business Value Report', margin, y + 6)
  y += 14

  addLine()

  // ===== Account Info =====
  checkPageBreak(20)
  pdf.setFontSize(16)
  pdf.setTextColor('#ffffff')
  pdf.setFont('helvetica', 'bold')
  pdf.text(result.nickname, margin, y)
  pdf.setFontSize(10)
  pdf.setTextColor('#888888')
  pdf.setFont('helvetica', 'normal')
  pdf.text(`@${result.username}`, margin + pdf.getTextWidth(result.nickname) + 5, y)
  y += 8

  pdf.setFontSize(10)
  pdf.setTextColor('#aaaaaa')
  pdf.text(
    `Followers: ${formatNumber(result.followerCount)} | Videos: ${result.videoCount} | Engagement: ${result.metrics.engagementRate}%`,
    margin, y,
  )
  y += 6
  pdf.text(`Score: ${result.score} | Tier: ${result.tier} | Region: ${result.region || 'N/A'}`, margin, y)
  y += 10

  addLine()

  // ===== Business Value =====
  checkPageBreak(40)
  pdf.setFontSize(14)
  pdf.setTextColor('#00F2EA')
  pdf.setFont('helvetica', 'bold')
  pdf.text('01  Business Value Assessment', margin, y)
  y += 8

  pdf.setFontSize(20)
  pdf.setTextColor('#00F2EA')
  pdf.setFont('helvetica', 'bold')
  pdf.text(
    `${formatUsd(result.businessValue.totalValue.low)} - ${formatUsd(result.businessValue.totalValue.high)}`,
    margin, y,
  )
  y += 10

  // Value components
  result.businessValue.components.forEach((comp) => {
    checkPageBreak(12)
    pdf.setFontSize(10)
    pdf.setTextColor('#cccccc')
    pdf.setFont('helvetica', 'bold')
    pdf.text(comp.label, margin, y)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor('#00F2EA')
    pdf.text(`${formatUsd(comp.amount.low)}-${formatUsd(comp.amount.high)} (${comp.percentage}%)`, margin + 60, y)
    y += 5
    pdf.setFontSize(8)
    pdf.setTextColor('#888888')
    pdf.text(comp.detail, margin + 5, y)
    y += 6
  })

  y += 4
  addLine()

  // ===== Verdict =====
  checkPageBreak(20)
  pdf.setFontSize(14)
  pdf.setTextColor('#FF0050')
  pdf.setFont('helvetica', 'bold')
  pdf.text('02  Evaluation Conclusion', margin, y)
  y += 8
  pdf.setFontSize(12)
  pdf.setTextColor('#ffffff')
  pdf.setFont('helvetica', 'bold')
  pdf.text(result.verdict, margin, y)
  y += 8
  pdf.setFontSize(10)
  pdf.setTextColor('#aaaaaa')
  pdf.setFont('helvetica', 'normal')

  // Split long text
  const lines = pdf.splitTextToSize(result.advice, contentWidth)
  lines.forEach((line: string) => {
    checkPageBreak(6)
    pdf.text(line, margin, y)
    y += 5
  })

  y += 4
  addLine()

  // If unlocked, add more sections
  if (isUnlocked) {
    // ===== Income & Growth =====
    checkPageBreak(30)
    pdf.setFontSize(14)
    pdf.setTextColor('#00F2EA')
    pdf.setFont('helvetica', 'bold')
    pdf.text('03  Income & Growth', margin, y)
    y += 8

    if (result.incomeEstimate) {
      pdf.setFontSize(12)
      pdf.setTextColor('#00F2EA')
      pdf.setFont('helvetica', 'bold')
      pdf.text(
        `Monthly: ${formatUsd(result.incomeEstimate.monthlyTotal.low)} - ${formatUsd(result.incomeEstimate.monthlyTotal.high)}`,
        margin, y,
      )
      y += 8

      result.incomeEstimate.breakdown.forEach((src) => {
        checkPageBreak(8)
        pdf.setFontSize(10)
        pdf.setTextColor('#cccccc')
        pdf.setFont('helvetica', 'normal')
        pdf.text(
          `${src.label}: ${formatUsd(src.monthlyAmount.low)}-${formatUsd(src.monthlyAmount.high)} (${src.percentage}%)`,
          margin, y,
        )
        y += 5
      })
    }

    y += 4
    addLine()

    // ===== Revenue Roadmap =====
    if (result.revenueRoadmap) {
      checkPageBreak(30)
      pdf.setFontSize(14)
      pdf.setTextColor('#00F2EA')
      pdf.setFont('helvetica', 'bold')
      pdf.text('04  Revenue Roadmap', margin, y)
      y += 8

      result.revenueRoadmap.projections.forEach((proj) => {
        checkPageBreak(8)
        pdf.setFontSize(10)
        pdf.setTextColor('#cccccc')
        pdf.setFont('helvetica', 'normal')
        pdf.text(
          `${proj.label}: ${formatUsd(proj.revenue.mid)} - ${proj.milestone}`,
          margin, y,
        )
        y += 5
      })

      checkPageBreak(8)
      pdf.setFontSize(10)
      pdf.setTextColor('#00F2EA')
      pdf.setFont('helvetica', 'bold')
      pdf.text(
        `12-Month Total: ${formatUsd(result.revenueRoadmap.total12Month.low)} - ${formatUsd(result.revenueRoadmap.total12Month.high)}`,
        margin, y,
      )
      y += 8

      addLine()
    }

    // ===== Commercialization =====
    if (result.commercializationAdvice) {
      checkPageBreak(30)
      pdf.setFontSize(14)
      pdf.setTextColor('#FF0050')
      pdf.setFont('helvetica', 'bold')
      pdf.text('05  Commercialization Directions', margin, y)
      y += 8

      result.commercializationAdvice.directions.forEach((dir) => {
        checkPageBreak(12)
        pdf.setFontSize(10)
        pdf.setTextColor('#cccccc')
        pdf.setFont('helvetica', 'bold')
        pdf.text(
          `${dir.name} (Fit: ${dir.fitScore}%) - ${formatUsd(dir.estimatedMonthlyRevenue.low)}-${formatUsd(dir.estimatedMonthlyRevenue.high)}/mo`,
          margin, y,
        )
        y += 5
        pdf.setFontSize(8)
        pdf.setTextColor('#888888')
        pdf.setFont('helvetica', 'normal')
        pdf.text(dir.description, margin + 5, y)
        y += 6
      })

      y += 4
      addLine()
    }

    // ===== Brand Matching =====
    if (result.brandMatching) {
      checkPageBreak(30)
      pdf.setFontSize(14)
      pdf.setTextColor('#00F2EA')
      pdf.setFont('helvetica', 'bold')
      pdf.text('06  Brand Matching', margin, y)
      y += 8

      result.brandMatching.matches.forEach((match) => {
        checkPageBreak(8)
        pdf.setFontSize(10)
        pdf.setTextColor('#cccccc')
        pdf.setFont('helvetica', 'normal')
        pdf.text(
          `${match.category}: ${formatUsd(match.estimatedDealRange.low)}-${formatUsd(match.estimatedDealRange.high)} (${match.fitScore}%)`,
          margin, y,
        )
        y += 5
      })

      addLine()
    }
  }

  // ===== Footer =====
  checkPageBreak(10)
  pdf.setFontSize(8)
  pdf.setTextColor('#666666')
  pdf.setFont('helvetica', 'normal')
  pdf.text(
    `Generated by TikWorth on ${new Date().toLocaleDateString('zh-CN')} | Data source: third-party API / Mock, for reference only`,
    margin, y,
  )

  // Save
  pdf.save(`tikworth-${result.username}-report.pdf`)
}