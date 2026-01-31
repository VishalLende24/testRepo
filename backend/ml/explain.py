#!/usr/bin/env python3
import sys
import json

def generate_explanations(duplicate_matches, triggered_rules):
    """
    Generate human-readable explanations
    """
    explanations = []
    
    # Process duplicate matches
    for match in duplicate_matches.get('exact', []):
        if match['field'] == 'aadhaar':
            explanations.append("Duplicate Aadhaar found in another application")
        elif match['field'] == 'phone':
            explanations.append("Phone number already exists in another application")
    
    for match in duplicate_matches.get('fuzzy', []):
        score_percent = int(match['score'] * 100)
        if match['field'] == 'name':
            explanations.append(f"Name similarity is {score_percent}% with existing record")
        elif match['field'] == 'address':
            explanations.append(f"Address similarity is {score_percent}% with existing record")
    
    # Process triggered rules
    for rule in triggered_rules:
        explanations.append(f"Rule triggered: {rule.get('description', 'Unknown rule')}")
    
    return explanations

if __name__ == "__main__":
    try:
        input_data = json.loads(sys.argv[1])
        duplicate_matches = input_data.get('duplicateMatches', {})
        triggered_rules = input_data.get('triggeredRules', [])
        
        result = generate_explanations(duplicate_matches, triggered_rules)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)