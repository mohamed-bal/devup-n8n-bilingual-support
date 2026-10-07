"""SQLite reference for an external intake adapter, not an n8n Code node.

Claims work once by a trusted event identity; it does not provide exactly-once
delivery, crash recovery, leases, or a production approval system.
"""
import hashlib
import json
import sqlite3

SCHEMA = """
CREATE TABLE IF NOT EXISTS inbox (
  tenant_id TEXT NOT NULL,
  source TEXT NOT NULL,
  message_id TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('claimed', 'completed')),
  review_packet TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id, source, message_id)
);
"""

def initialize(connection):
    connection.executescript(SCHEMA)

def claim(connection, event):
    """Return 'claimed' for new work, or stored state for an exact duplicate.

    Identity fields and event timestamp/IDs must come from verified intake.
    Use a separate database connection for each concurrent worker.
    """
    canonical = json.dumps(event, ensure_ascii=False, sort_keys=True,
                           separators=(",", ":")).encode("utf-8")
    digest = hashlib.sha256(canonical).hexdigest()
    key = (event["tenantId"], event["source"], event["messageId"])
    connection.execute("BEGIN IMMEDIATE")
    try:
        cursor = connection.execute(
            "INSERT INTO inbox (tenant_id,source,message_id,payload_sha256,state) "
            "VALUES (?,?,?,?,'claimed') ON CONFLICT DO NOTHING", (*key, digest))
        if cursor.rowcount == 1:
            connection.commit()
            return {"new": True, "state": "claimed", "review_packet": None}
        row = connection.execute(
            "SELECT payload_sha256,state,review_packet FROM inbox "
            "WHERE tenant_id=? AND source=? AND message_id=?", key).fetchone()
        if row[0] != digest:
            raise ValueError("same_event_id_with_different_payload")
        connection.commit()
        return {"new": False, "state": row[1],
                "review_packet": json.loads(row[2]) if row[2] else None}
    except Exception:
        connection.rollback()
        raise

def complete(connection, event, packet):
    key = (event["tenantId"], event["source"], event["messageId"])
    encoded = json.dumps(packet, ensure_ascii=False, sort_keys=True)
    with connection:
        cursor = connection.execute(
            "UPDATE inbox SET state='completed',review_packet=?,updated_at=CURRENT_TIMESTAMP "
            "WHERE tenant_id=? AND source=? AND message_id=? AND state='claimed'",
            (encoded, *key))
        if cursor.rowcount != 1:
            raise ValueError("no_uncompleted_claim")

if __name__ == "__main__":
    db = sqlite3.connect(":memory:")
    initialize(db)
    sample = {"tenantId": "demo-shop", "source": "manual", "messageId": "msg-1",
              "customerId": "customer-001", "replyLocale": "ar", "text": "DZ-1042"}
    print(claim(db, sample))
    complete(db, sample, {"deliveryStatus": "not_sent", "requiresHumanApproval": True})
    print(claim(db, sample))
