#!/usr/bin/env python3
import sys
import json

def calculate_risk_score(triggered_rules):
    """
    Calculate risk score from triggered rules
    """
    total_score = sum(rule.get('score', 0) for rule in triggered_rules)
    
    # Normalize to 0-100 scale (assuming max possible score is 300)
    normalized_score = min(100, (total_score / 300) * 100)
    
    # Determine risk band
    if normalized_score <= 30:
        risk_band = "LOW"
    elif normalized_score <= 70:
        risk_band = "MEDIUM"
    else:
        risk_band = "HIGH"
    
    return {
        "totalScore": total_score,
        "normalizedScore": round(normalized_score, 2),
        "riskBand": risk_band
    }

if __name__ == "__main__":
    try:
        triggered_rules = json.loads(sys.argv[1])
        result = calculate_risk_score(triggered_rules)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)