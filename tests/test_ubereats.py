#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
import importlib.util
import contextlib
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("ubereats", Path(__file__).resolve().parent.parent / "scripts/ubereats.py")
ue = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ue)

class UberEatsTest(unittest.TestCase):
    def test_cookie_domain_scope_and_deduplication(self):
        cookies = [
            {"domain": ".ubereats.com", "name": "session", "value": "synthetic"},
            {"domain": "www.ubereats.com", "name": "session", "value": "duplicate"},
            {"domain": "evilubereats.com", "name": "bad", "value": "ignore"},
            {"domain": "ubereats.com.evil.test", "name": "bad2", "value": "ignore"},
            {"domain": ".uber.com", "name": "unrelated", "value": "ignore"},
        ]
        self.assertEqual(ue.cookie_header(cookies, ue.HOST), ("session=synthetic", 1))

    def test_explicit_cookie_file_does_not_access_safari(self):
        with tempfile.TemporaryDirectory() as temp:
            p = Path(temp) / "cookie.txt"; p.write_text("a=synthetic; b=synthetic")
            with patch.object(ue, "parse_binarycookies", side_effect=AssertionError("must not read Safari")):
                self.assertEqual(ue.load_cookie_header(str(p)), ("a=synthetic; b=synthetic", 2))

    def test_receipt_price_scales(self):
        group = {"cart": [{"CustomerName": "Example", "Items": [{"Title": "Meal", "TotalPrice": {"AmountE5": 16000000}}]}]}
        single = {"cart": [{"customerName": "Example", "items": [{"title": "Meal", "totalPrice": {"amountE5": 16000}}]}]}
        for receipt in [group, single]:
            parsed = ue.parse_receipt(receipt)
            self.assertEqual(parsed["total"], 160)
            self.assertEqual(parsed["people"][0]["items"][0]["price"], 160)

    def test_ledger_preserves_settlements_names_and_is_idempotent(self):
        with tempfile.TemporaryDirectory() as temp, contextlib.redirect_stderr(io.StringIO()):
            paid = {"order_uuid":"old", "date":"2026-09-01", "store":"Example", "uber_name":"Friend", "items":"Meal", "amount":"160", "paid":"yes", "paid_date":"2026-09-02", "note":"keep me"}
            mapping = {"uber_name":"Friend", "real_name":"Custom Name", "note":"keep mapping"}
            ue._write_csv(str(Path(temp)/"debts.csv"), ue.DEBT_COLS, [paid])
            ue._write_csv(str(Path(temp)/"names.csv"), ue.NAME_COLS, [mapping])
            orders = [{"uuid":u,"completedAt":"2026-09-03","isCancelled":u=="cancelled"} for u in ["old","new","cancelled","joined"]]
            beo = {o["uuid"]:{"isOrderCreator":o["uuid"]!="joined", "creatorDisplayName":"Me"} for o in orders}
            parsed = {"store":"Example", "people":[{"name":n,"items":[{"qty":1,"title":"Meal","price":160}]} for n in ["Me (You)","Friend"]]}
            with patch.object(ue,"fetch_parsed",return_value=(parsed,"cache")) as fetch:
                new, debts, names = ue.run_ledger(orders,beo,None,temp,False)
                self.assertEqual(len(new),1)
                self.assertEqual(new[0]["uber_name"],"Friend")
                self.assertEqual(debts[("old","Friend")],paid)
                self.assertEqual(names["Friend"],mapping)
                self.assertEqual(fetch.call_count,1)
                again, debts2, names2 = ue.run_ledger(orders,beo,None,temp,False)
                self.assertEqual(again,[])
                self.assertEqual(debts2,debts)
                self.assertEqual(names2,names)
                self.assertEqual(fetch.call_count,1)

    def test_receipt_failure_uses_past_order_fallback(self):
        def failed(*args): raise ValueError("unavailable")
        parsed, source = ue.fetch_parsed("example",failed,None,False,{"example":{"completedAt":"2026-09-03","creatorDisplayName":"Example","userGroupedItems":[{"items":[{"title":"Meal","price":16000}]}]}})
        self.assertEqual(source,"order-list")
        self.assertEqual(parsed["total"],160)

if __name__ == "__main__": unittest.main()
