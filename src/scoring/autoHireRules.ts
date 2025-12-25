// src/scoring/autoHireRules.ts

export type Verdict = "HIRE" | "MAYBE" | "REJECT"

export function autoHireDecision(
  score: number,
  resumeText: string
): { verdict: Verdict; reasons: string[] } {

  const text = resumeText.toLowerCase()
  const reasons: string[] = []

  // ---- keyword signals ----
  const strongKeywords = [
    "sales",
    "business development",
    "client",
    "target",
    "revenue",
    "conversion",
    "lead",
    "crm"
  ]

  const keywordHits = strongKeywords.filter(k => text.includes(k))

  // ---- decision logic ----
  if (score >= 75 && keywordHits.length >= 2) {
    reasons.push("Strong sales keywords detected")
    reasons.push(`Score ${score} meets auto-hire threshold`)
    return { verdict: "HIRE", reasons }
  }

  if (score >= 40) {
    reasons.push("Moderate score")
    reasons.push("Some sales indicators found")
    return { verdict: "MAYBE", reasons }
  }

  reasons.push("Low score or insufficient sales relevance")
  return { verdict: "REJECT", reasons }
}
