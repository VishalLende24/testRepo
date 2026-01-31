#!/usr/bin/env python3
import sys
import json
from rapidfuzz import fuzz

def detect_duplicates(current_app, existing_apps):
    """
    Detect job application duplicates using exact and fuzzy matching
    """
    results = {
        "exactMatches": [],
        "fuzzyMatches": []
    }
    
    for existing in existing_apps:
        # Exact matches
        if current_app.get('aadhaarHash') == existing.get('aadhaarHash'):
            results["exactMatches"].append({
                "applicationId": existing.get('_id'),
                "field": "aadhaar",
                "score": 1.0
            })
        
        if current_app.get('email') == existing.get('email'):
            results["exactMatches"].append({
                "applicationId": existing.get('_id'),
                "field": "email",
                "score": 1.0
            })
        
        if current_app.get('phone') == existing.get('phone'):
            results["exactMatches"].append({
                "applicationId": existing.get('_id'),
                "field": "phone", 
                "score": 1.0
            })
        
        # Fuzzy matches
        name_score = fuzz.token_sort_ratio(current_app.get('fullName', '').lower(), existing.get('fullName', '').lower()) / 100.0
        if name_score >= 0.85:
            results["fuzzyMatches"].append({
                "applicationId": existing.get('_id'),
                "field": "fullName",
                "score": name_score
            })
        
        address_score = fuzz.token_sort_ratio(current_app.get('address', '').lower(), existing.get('address', '').lower()) / 100.0
        if address_score >= 0.8:
            results["fuzzyMatches"].append({
                "applicationId": existing.get('_id'),
                "field": "address",
                "score": address_score
            })
    
    return results

if __name__ == "__main__":
    try:
        input_data = json.loads(sys.argv[1])
        current_app = input_data['current']
        existing_apps = input_data['existing']
        
        result = detect_duplicates(current_app, existing_apps)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)