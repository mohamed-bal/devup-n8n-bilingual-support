import concurrent.futures
import os
import sqlite3
import tempfile
import unittest
from inbox_demo import initialize, claim, complete

EVENT = {"tenantId": "demo-shop", "source": "manual", "messageId": "msg-1",
         "customerId": "customer-001", "replyLocale": "ar", "text": "DZ-1042"}

class InboxTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        initialize(self.db)

    def tearDown(self):
        self.db.close()

    def test_claim_then_duplicate(self):
        self.assertTrue(claim(self.db, EVENT)["new"])
        self.assertFalse(claim(self.db, EVENT)["new"])

    def test_changed_payload_under_same_identity_rejected(self):
        claim(self.db, EVENT)
        with self.assertRaisesRegex(ValueError, "different_payload"):
            claim(self.db, {**EVENT, "text": "different"})

    def test_completed_result_reused(self):
        claim(self.db, EVENT)
        packet = {"deliveryStatus": "not_sent", "requiresHumanApproval": True}
        complete(self.db, EVENT, packet)
        again = claim(self.db, EVENT)
        self.assertEqual(again["state"], "completed")
        self.assertEqual(again["review_packet"], packet)
        with self.assertRaises(ValueError):
            complete(self.db, EVENT, packet)

    def test_tenant_identity_scopes_duplicate(self):
        claim(self.db, EVENT)
        self.assertTrue(claim(self.db, {**EVENT, "tenantId": "another-shop"})["new"])

    def test_concurrent_workers_only_one_new_claim(self):
        with tempfile.TemporaryDirectory() as directory:
            filename = os.path.join(directory, "inbox.db")
            with sqlite3.connect(filename) as db:
                initialize(db)
            def worker(_):
                with sqlite3.connect(filename, timeout=10) as db:
                    return claim(db, EVENT)["new"]
            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
                results = list(pool.map(worker, range(16)))
            self.assertEqual(sum(results), 1)

if __name__ == "__main__":
    unittest.main()
