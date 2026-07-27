/**
 * Hydro-inspect — form + file attachments via Gmail.
 *
 * IMPORTANT: Web3Forms free plan blocks server-side sends, so files must
 * go through GmailApp. Redeploy after every change:
 * Deploy → Manage deployments → pencil → New version → Deploy
 * Execute as: Me | Who has access: Anyone
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

    var options = {
      name: "Хидроинспект",
      replyTo: email,
    };

    if (data.attachment && data.attachmentName && data.attachmentType) {
      var bytes = Utilities.base64Decode(String(data.attachment));
      options.attachments = [
        Utilities.newBlob(
          bytes,
          String(data.attachmentType),
          String(data.attachmentName)
        ),
      ];
    }

    GmailApp.sendEmail(
      TO_EMAIL,
      "Хидроинспект — ново запитване",
      body,
      options
    );

    return json_({ success: true });
  } catch (err) {
    return json_({ success: false, message: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: "hydro-inspect-mailer" });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
