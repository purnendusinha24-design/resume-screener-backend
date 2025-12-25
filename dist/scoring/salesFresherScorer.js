"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreSalesFresherResume = scoreSalesFresherResume;
function scoreSalesFresherResume(text) {
    const lower = text.toLowerCase();
    let keywordScore = 0;
    let experienceScore = 0;
    let techScore = 0;
    let qualityScore = 0;
    // Keyword signals
    const keywords = ['sales', 'client', 'revenue', 'customer', 'lead', 'closing'];
    keywords.forEach(k => {
        if (lower.includes(k))
            keywordScore += 5;
    });
    keywordScore = Math.min(keywordScore, 40);
    // Experience indicators
    if (lower.includes('experience'))
        experienceScore += 10;
    if (lower.includes('intern'))
        experienceScore += 5;
    if (lower.includes('year'))
        experienceScore += 10;
    experienceScore = Math.min(experienceScore, 25);
    // Tech exposure
    if (lower.includes('crm'))
        techScore += 10;
    if (lower.includes('excel'))
        techScore += 5;
    if (lower.includes('salesforce'))
        techScore += 10;
    techScore = Math.min(techScore, 20);
    // Resume quality
    if (text.length > 800)
        qualityScore += 10;
    if (text.length > 1200)
        qualityScore += 5;
    const score = keywordScore + experienceScore + techScore + qualityScore;
    let verdict;
    if (score >= 70)
        verdict = "HIRE";
    else if (score >= 40)
        verdict = "MAYBE";
    else
        verdict = "REJECT";
    return {
        score,
        verdict,
        breakdown: {
            keywords: keywordScore,
            experience: experienceScore,
            tech: techScore,
            quality: qualityScore
        }
    };
}
