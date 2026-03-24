/**
 * Utility for calculating Skill Rating (ELO-based) for the Bosh Arena.
 */

// Mapping of Handicap (HC) to Initial Skill Rating
export const HC_RATING_MAP: Record<string, number> = {
    '1': 50,
    '2': 100,
    '3': 150,
    '4': 200,   // Standard Beginner/Entry
    '5': 300,   // Amateur
    '6': 400,   // Semi-Pro
    '7': 550,   // Pro
    '8': 700,   // Master
    '9': 800,  // Grandmaster
};

export function getInitialRatingFromHC(hc: string): number {
    const rating = HC_RATING_MAP[hc];
    if (rating === undefined) {
        // Fallback for custom HC strings or unexpected values
        const numericHC = parseInt(hc);
        if (!isNaN(numericHC)) {
            if (numericHC <= 1) return 50;
            if (numericHC >= 9) return 800;
            // Linear interpolation estimate for unknown numeric HC if needed
            return numericHC * 80; 
        }
        return 200; // Default to HC 4 Equivalent
    }
    return rating;
}

/**
 * Calculates the new ratings for two players after a match.
 * Uses a simplified ELO formula.
 * 
 * @param winnerRating Current rating of the winner
 * @param loserRating Current rating of the loser
 * @param winnerConfidence Games played by winner (to adjust K-factor)
 * @param loserConfidence Games played by loser (to adjust K-factor)
 * @returns { winnerNewRating: number, loserNewRating: number, delta: number }
 */
export function calculateMatchRating(
    winnerRating: number,
    loserRating: number,
    winnerConfidence: number = 0,
    loserConfidence: number = 0
) {
    // K-Factor determines how much a rating changes. 
    // New players (low confidence) have higher K-factor for faster calibration.
    const getKFactor = (conf: number) => (conf < 20 ? 40 : 20);

    const Kw = getKFactor(winnerConfidence);
    const Kl = getKFactor(loserConfidence);

    // Expected score (Probability of winning)
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

    // Calculate Rating Delta
    const winnerDelta = Math.round(Kw * (1 - expectedWinner));
    const loserDelta = Math.round(Kl * (0 - expectedLoser)); // Negative value

    return {
        winnerNewRating: winnerRating + winnerDelta,
        loserNewRating: Math.max(0, loserRating + loserDelta), // Loser cannot go below 0
        delta: winnerDelta
    };
}
