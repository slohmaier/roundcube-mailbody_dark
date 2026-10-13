#!/usr/bin/env bash
# Sets up the test stack AFTER the containers are running:
#  - waits for Roundcube
#  - creates the test user (login test/test) and sets English UI language
#  - delivers a synthetic HTML newsletter into the INBOX (no live data)
#
# Usage:  docker compose up -d && ./setup.sh
set -euo pipefail
cd "$(dirname "$0")"

DOCKER="${DOCKER:-docker}"
BASE="http://127.0.0.1:8098"
RUSER="test"; RPASS="test"

echo ">> Waiting for Roundcube ($BASE) ..."
for i in $(seq 1 60); do
    curl -sf "$BASE/" -o /dev/null && break
    sleep 2
    [ "$i" = 60 ] && { echo "Roundcube not reachable"; exit 1; }
done

echo ">> Login (creates the user in the DB) ..."
J="$(mktemp)"
TOKEN="$(curl -s -c "$J" "$BASE/" | grep -oP 'name="_token"[^>]*value="\K[^"]+' | head -1)"
curl -s -b "$J" -c "$J" -X POST "$BASE/?_task=login&_action=login" \
    --data-urlencode "_token=$TOKEN" --data-urlencode "_user=$RUSER" --data-urlencode "_pass=$RPASS" -o /dev/null
rm -f "$J"

echo ">> Set UI language to English ..."
$DOCKER compose exec -T rc-md-roundcube php -r '
define("INSTALL_PATH","/var/www/html/");
require_once INSTALL_PATH."program/include/clisetup.php";
$rc = rcmail::get_instance();
$db = $rc->get_dbh();
$res = $db->query("SELECT user_id FROM users WHERE username = ?", "test");
$row = $db->fetch_assoc($res);
if (!$row) { fwrite(STDERR, "Test user not found\n"); exit(1); }
$u = new rcube_user((int) $row["user_id"]);
$u->save_prefs(["language" => "en_US"]);
$db->query("UPDATE identities SET email=? WHERE user_id=? AND standard=1", "test@example.com", (int) $row["user_id"]);
echo "   language + identity set (user_id=".$row["user_id"].")\n";
'

echo ">> Deliver a synthetic HTML newsletter via IMAP ..."
python3 - <<'PY'
import imaplib, time
html = """<!DOCTYPE html>
<html><body style="margin:0;background:#f2f4f7;font-family:Arial,Helvetica,sans-serif;color:#1f2933">
<div style="max-width:640px;margin:0 auto;background:#ffffff">
  <div style="background:#3d5afe;color:#ffffff;padding:24px 28px">
    <div style="font-size:13px;letter-spacing:2px;opacity:.85">ACME NEWSLETTER</div>
    <h1 style="margin:6px 0 0;font-size:26px">This week at ACME</h1>
  </div>
  <div style="padding:24px 28px">
    <p style="font-size:15px;line-height:1.6">Hi there,</p>
    <p style="font-size:15px;line-height:1.6">here is what happened this week. We shipped
      a new dashboard, improved performance and published two articles you might like.</p>
    <div style="border:1px solid #e4e7eb;border-radius:8px;padding:16px 18px;margin:18px 0">
      <div style="font-weight:bold;font-size:16px;color:#111827">New dashboard is live</div>
      <p style="font-size:14px;line-height:1.6;color:#52606d">Charts, filters and a cleaner
        layout. Read the release notes for the full list.</p>
      <a href="https://example.com/dashboard" style="display:inline-block;background:#3d5afe;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px">Open the dashboard</a>
    </div>
    <div style="border:1px solid #e4e7eb;border-radius:8px;padding:16px 18px;margin:18px 0">
      <div style="font-weight:bold;font-size:16px;color:#111827">Two new articles</div>
      <ul style="font-size:14px;line-height:1.7;color:#52606d">
        <li><a href="https://example.com/a1" style="color:#3d5afe">Speeding up search</a></li>
        <li><a href="https://example.com/a2" style="color:#3d5afe">Designing for accessibility</a></li>
      </ul>
    </div>
    <table role="presentation" width="100%" style="border-collapse:collapse;margin-top:8px">
      <tr>
        <td style="padding:12px;background:#f8f9fb;border:1px solid #e4e7eb;text-align:center">
          <div style="font-size:22px;font-weight:bold;color:#111827">128</div>
          <div style="font-size:12px;color:#7b8794">deploys</div></td>
        <td style="padding:12px;background:#f8f9fb;border:1px solid #e4e7eb;text-align:center">
          <div style="font-size:22px;font-weight:bold;color:#111827">99.98%</div>
          <div style="font-size:12px;color:#7b8794">uptime</div></td>
        <td style="padding:12px;background:#f8f9fb;border:1px solid #e4e7eb;text-align:center">
          <div style="font-size:22px;font-weight:bold;color:#111827">4.9</div>
          <div style="font-size:12px;color:#7b8794">rating</div></td>
      </tr>
    </table>
    <p style="font-size:13px;color:#9aa5b1;margin-top:24px">You are receiving this because you
      subscribed to ACME updates. Unsubscribe anytime.</p>
  </div>
  <div style="background:#111827;color:#9aa5b1;padding:16px 28px;font-size:12px">
    ACME Inc. &middot; 1 Example Street &middot; example.com
  </div>
</div>
</body></html>"""

eml = (
 "From: ACME Newsletter <newsletter@example.com>\r\n"
 "To: test@example.com\r\n"
 "Subject: ACME weekly newsletter\r\n"
 "Date: Mon, 01 Jun 2026 09:00:00 +0000\r\n"
 "MIME-Version: 1.0\r\n"
 'Content-Type: text/html; charset="UTF-8"\r\n'
 "Content-Transfer-Encoding: 8bit\r\n\r\n"
 + html
)
M = imaplib.IMAP4('127.0.0.1', 3144)
M.login('test', 'test')
M.append('INBOX', None, imaplib.Time2Internaldate(time.time()), eml.encode('utf-8'))
M.logout()
print("newsletter delivered")
PY

echo ""
echo "Done. Roundcube: $BASE   Login: $RUSER / $RPASS"
