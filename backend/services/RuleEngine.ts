import Rule, { IRule, ICondition } from '../models/Rule';

export interface RuleEvaluationResult {
  matchedRules: {
    ruleId: string;
    ruleName: string;
    score: number;
    reason: string;
  }[];
  ruleScore: number;
}

export class RuleEngine {
  
  async evaluateRules(applicationData: any): Promise<RuleEvaluationResult> {
    const activeRules = await Rule.find({ isActive: true }).sort({ priority: 1 });
    const matchedRules = [];
    let totalScore = 0;

    for (const rule of activeRules) {
      const evaluation = this.evaluateRule(rule, applicationData);
      if (evaluation.matched) {
        matchedRules.push({
          ruleId: rule.ruleId,
          ruleName: rule.name,
          score: rule.score,
          reason: evaluation.reason
        });
        totalScore += rule.score;
      }
    }

    return {
      matchedRules,
      ruleScore: Math.min(totalScore, 100) // Cap at 100
    };
  }

  private evaluateRule(rule: IRule, data: any): { matched: boolean; reason: string } {
    const conditionResults = rule.conditions.map(condition => 
      this.evaluateCondition(condition, data)
    );

    const matched = rule.logic === 'AND' 
      ? conditionResults.every(r => r.matched)
      : conditionResults.some(r => r.matched);

    const reasons = conditionResults
      .filter(r => r.matched)
      .map(r => r.reason)
      .join(rule.logic === 'AND' ? ' AND ' : ' OR ');

    return {
      matched,
      reason: matched ? reasons : 'Conditions not met'
    };
  }

  private evaluateCondition(condition: ICondition, data: any): { matched: boolean; reason: string } {
    const fieldValue = this.getFieldValue(data, condition.field);
    const { operator, value } = condition;

    let matched = false;
    let reason = '';

    switch (operator) {
      case 'equals':
        matched = fieldValue === value;
        reason = `${condition.field} equals ${value}`;
        break;
      
      case 'not_equals':
        matched = fieldValue !== value;
        reason = `${condition.field} not equals ${value}`;
        break;
      
      case 'greater_than':
        matched = Number(fieldValue) > Number(value);
        reason = `${condition.field} (${fieldValue}) > ${value}`;
        break;
      
      case 'less_than':
        matched = Number(fieldValue) < Number(value);
        reason = `${condition.field} (${fieldValue}) < ${value}`;
        break;
      
      case 'contains':
        matched = String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
        reason = `${condition.field} contains "${value}"`;
        break;
      
      case 'regex':
        const regex = new RegExp(value);
        matched = regex.test(String(fieldValue));
        reason = `${condition.field} matches pattern ${value}`;
        break;
      
      case 'in_range':
        const [min, max] = Array.isArray(value) ? value : [value.min, value.max];
        const numValue = Number(fieldValue);
        matched = numValue >= min && numValue <= max;
        reason = `${condition.field} (${fieldValue}) in range [${min}, ${max}]`;
        break;
    }

    return { matched, reason };
  }

  private getFieldValue(data: any, fieldPath: string): any {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], data);
  }
}