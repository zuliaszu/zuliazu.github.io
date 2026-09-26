#!/usr/bin/env python3
"""Offline AI application starter. Run: python3 ai-starter.py
Uses a stub, NOT a language model. Fictional data only, no network or dependencies.
The stub tests the application's boundaries; it cannot test model prompt injection.
Replace model_reply() with an approved model adapter later and repeat evaluations.
"""
import json
import unittest

DOCS = {'returns': 'Unused bikes can be returned within 30 days.',
        'shipping': 'Standard delivery takes 3 to 5 working days.'}
ORDERS = {'N100': {'owner': 'alice', 'status': 'shipped'},
          'N200': {'owner': 'bob', 'status': 'processing'}}

def retrieve(question):
    """Tiny keyword retrieval over public fictional documents, not private records."""
    keys = [k for k in DOCS if k.rstrip('s') in question.lower()]
    return {k: DOCS[k] for k in keys}

def model_reply(question, sources):
    """Deterministic stub. Deliberately uses no credentials or executable tools."""
    if 'returns' in sources:
        return json.dumps({'answer': 'Unused bikes can be returned within 30 days.', 'sources': ['returns']})
    if 'shipping' in sources:
        return json.dumps({'answer': 'Standard delivery takes 3 to 5 working days.', 'sources': ['shipping']})
    return json.dumps({'answer': 'The provided documents do not answer this question.', 'sources': []})

def validate_reply(raw, allowed_sources):
    """Format and citation-ID checks, NOT a truth or prompt-injection guarantee."""
    value = json.loads(raw)
    if not isinstance(value, dict) or set(value) != {'answer', 'sources'}:
        raise ValueError('Unexpected fields')
    if not isinstance(value['answer'], str) or not 1 <= len(value['answer']) <= 2000:
        raise ValueError('Invalid answer')
    ids = value['sources']
    if not isinstance(ids, list) or any(not isinstance(s, str) or s not in allowed_sources for s in ids):
        raise ValueError('Invalid source ID')
    return value

def lookup_order(caller, order_id):
    """Caller comes from trusted application auth, never a model-supplied identity.
    This exercise passes it directly; production needs real authenticated context.
    """
    record = ORDERS.get(order_id)
    if record is None or record['owner'] != caller:
        raise PermissionError('Order unavailable')
    return {'order_id': order_id, 'status': record['status']}

def answer(question):
    sources = retrieve(question)
    return validate_reply(model_reply(question, sources), sources)

class BoundaryTests(unittest.TestCase):
    def test_returns(self): self.assertEqual(answer('What are the return rules?')['sources'], ['returns'])
    def test_shipping(self): self.assertEqual(answer('What is the shipping time?')['sources'], ['shipping'])
    def test_unknown(self): self.assertEqual(answer('What is your VAT number?')['sources'], [])
    def test_bad_json(self):
        with self.assertRaises(json.JSONDecodeError): validate_reply('not json', DOCS)
    def test_extra_action(self):
        with self.assertRaises(ValueError): validate_reply('{"answer":"OK","sources":[],"refund":50}', DOCS)
    def test_bad_source(self):
        with self.assertRaises(ValueError): validate_reply('{"answer":"OK","sources":["secret"]}', DOCS)
    def test_answer_type(self):
        with self.assertRaises(ValueError): validate_reply('{"answer":50,"sources":[]}', DOCS)
    def test_own_order(self): self.assertEqual(lookup_order('alice','N100')['status'],'shipped')
    def test_other_order(self):
        with self.assertRaises(PermissionError): lookup_order('alice','N200')
    def test_missing_order(self):
        with self.assertRaises(PermissionError): lookup_order('alice','N999')
    def test_valid_schema_is_not_truth(self):
        # Demonstrates a limitation: a harmful claim can still have valid JSON.
        value=validate_reply('{"answer":"All refunds are approved","sources":["returns"]}',DOCS)
        self.assertEqual(value['answer'],'All refunds are approved')

if __name__ == '__main__':
    print('Offline stub: application checks only, not an evaluation of a real model.')
    print(json.dumps(answer('What is the return policy?'), indent=2))
    unittest.main()
