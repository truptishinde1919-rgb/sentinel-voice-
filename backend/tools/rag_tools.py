import math
import re
from typing import List, Dict, Any

POLICY_KNOWLEDGE_BASE = [
    {
        "id": "POL-FEE-01",
        "category": "Fee Waiver",
        "title": "Automated Fee Waiver Authorization Policy",
        "content": (
            "Sentinel Autonomous Servicing Policy: Servicing agents are authorized to execute "
            "courtesy fee waivers (overdraft, wire transfer, late payment fee) up to a hard ceiling of $50.00 USD. "
            "Prerequisites: (1) Account risk tier must be Tier 1 (Low) or Tier 2 (Standard). "
            "(2) Customer has not received another fee waiver within the preceding 90 days. "
            "(3) Dynamic fraud risk score must be <= 15.0%. Waivers exceeding $50.00 require human supervisor approval."
        ),
        "tags": ["fee", "waiver", "late fee", "overdraft", "refund", "charge", "50"]
    },
    {
        "id": "POL-CRD-02",
        "category": "Credit Limit",
        "title": "Credit Limit Increase & Adjustment Policy",
        "content": (
            "Credit Line Adjustment Rules: Autonomous credit limit increases are capped at 25.0% of the current "
            "credit limit. Requirements: (1) Account age >= 6 months. (2) Active facial biometric match score >= 85.0% "
            "and liveness verified. (3) Account risk tier <= 2. (4) Total fraud risk score <= 15.0%. "
            "Increases exceeding 25% or requested by Tier 3 accounts require human underwriter escalation."
        ),
        "tags": ["credit", "limit", "increase", "line", "borrow", "card", "25%"]
    },
    {
        "id": "POL-SEC-03",
        "category": "Card Replacement",
        "title": "Lost/Damaged Card Reissuance & Fraud Freeze Policy",
        "content": (
            "Card Replacement Procedures: Upon customer request to replace lost, damaged, or compromised debit/credit cards: "
            "(1) Existing card number is instantly marked frozen/inactive. "
            "(2) Strict biometric verification: Passive facial liveness check must pass AND biometric match score must be >= 85.0%. "
            "(3) Expedited shipping (2-3 business days) is ordered to verified billing address on file. "
            "(4) If fraud risk score is > 15.0%, replacement is blocked and routed to Fraud Specialist."
        ),
        "tags": ["card", "replace", "lost", "stolen", "freeze", "reissue", "stolen card"]
    },
    {
        "id": "POL-ESC-04",
        "category": "Escalation & Compliance",
        "title": "Human-in-the-Loop (HITL) Warm Transfer & Fraud Protocol",
        "content": (
            "Compliance Safeguard & Supervisor Escalation: If dynamic biometric fraud risk exceeds 15.0%, "
            "or if facial liveness fails, or if a customer demonstrates severe distress or explicit request for a human, "
            "the autonomous agent must immediately pause execution and initiate a Warm Transfer with full session context, "
            "biometric telemetry, and reasoning audit trace transferred to the Supervisor Operations Center."
        ),
        "tags": ["escalate", "human", "supervisor", "fraud", "transfer", "risk", "15%"]
    },
]

class PolicyVectorStore:
    """
    In-memory semantic vector search for Sentinel banking policies.
    Provides fast, deterministic policy retrieval and similarity scoring.
    """
    def __init__(self):
        self.documents = POLICY_KNOWLEDGE_BASE

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\b[a-z0-9]{2,}\b', text.lower())

    def search_policy(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        query_tokens = set(self._tokenize(query))
        if not query_tokens:
            return self.documents[:top_k]

        scored_docs = []
        for doc in self.documents:
            doc_tokens = self._tokenize(doc["title"] + " " + doc["content"] + " " + " ".join(doc["tags"]))
            if not doc_tokens:
                continue
            
            # Compute token overlap & tag matching
            doc_token_set = set(doc_tokens)
            overlap = query_tokens.intersection(doc_token_set)
            
            # Bonus weight for tags and title hits
            tag_hits = sum(2 for tag in doc["tags"] if tag.lower() in query.lower())
            
            score = (len(overlap) * 2.5 + tag_hits * 3.0) / (math.sqrt(len(query_tokens)) * math.sqrt(len(doc_token_set)) + 1e-5)
            scored_docs.append((score, doc))

        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [
            {
                "id": doc["id"],
                "category": doc["category"],
                "title": doc["title"],
                "content": doc["content"],
                "relevance_score": round(min(1.0, score), 3)
            }
            for score, doc in scored_docs[:top_k]
        ]

policy_kb = PolicyVectorStore()
