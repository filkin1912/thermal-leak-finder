/**
 * Hydro-inspect — form + optional file → email.
 * Called from Cloud Run /api/contact (server-side).
 *
 * ONE-TIME SETUP (required for attachments):
 * 1. Paste this file into script.google.com
 * 2. Select function testSend → Run → Allow/Authorize all mail permissions
 * 3. Deploy → Manage deployments → New version → Deploy
 *    Execute as: Me | Who has access: Anyone
 */
var TO_EMAIL = "hydroinspect@gmail.com";

function doPost(e) {
  try {
    var data = JSON.parse((e.postData && e.postData.contents) || "{}");
    var name = String(data.name || "").trim();
    var phone = String(data.phone || "").trim();
    var email = String(data.email || "").trim();
    var message = String(data.message || "").trim();

    if (!email || !message) {
      return json_({ success: false, message: "Missing email or message" });
    }

    var body =
      "Име: " +
      name +
      "\nТелефон: " +
      phone +
      "\nИмейл: " +
      email +
      "\n\nСъобщение:\n" +
      message;

    var mail = {
      to: TO_EMAIL,
      subject: "Хидроинспект — ново запитване",
      body: body,
      name: "Хидроинспект",
      replyTo: email,
    };

    if (data.attachment && data.attachmentName) {
      var bytes = Utilities.base64Decode(String(data.attachment));
      var safeName = String(data.attachmentName)
        .replace(/[\\\/\?\%\*\:\|\"<>]/g, "_")
        .slice(0, 180);
      var mime = String(data.attachmentType || "application/octet-stream");
      mail.attachments = [Utilities.newBlob(bytes, mime, safeName || "file")];
    }

    // MailApp scope is simpler to authorize than GmailApp for web apps
    MailApp.sendEmail(mail);

    return json_({ success: true });
  } catch (err) {
    return json_({ success: false, message: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: "hydro-inspect-mailer" });
}

/** Run once from the editor to trigger the mail permission prompt. */
function testSend() {
  MailApp.sendEmail({
    to: TO_EMAIL,
    subject: "Хидроинспект — тест",
    body: "Тестът е успешен. Формата може да изпраща имейли с прикачени файлове.",
    name: "Хидроинспект",
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
