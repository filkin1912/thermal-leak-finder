/**
 * Hydro-inspect contact form mailer (with optional attachment)
 *
 * Deploy:
 * 1. Open https://script.google.com → project for hydroinspect@gmail.com
 * 2. Replace Code.gs with this file
 * 3. Deploy → Manage deployments → Edit → New version → Deploy
 * 4. Who has access: Anyone
 */
function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || "{}");
    const name = String(data.name || "").trim();
    const phone = String(data.phone || "").trim();
    const email = String(data.email || "").trim();
    const message = String(data.message || "").trim();

    if (!email) {
      return json_({ success: false, message: "Missing email" });
    }

    const mail = {
      to: "hydroinspect@gmail.com",
      subject: "Hydro-inspect",
      body: ["Име: " + name, "Телефон: " + phone, "Имейл: " + email, "Съобщение: " + message].join("\n"),
      name: "Хидроинспект",
      replyTo: email,
    };

    if (data.attachment && data.attachmentName && data.attachmentType) {
      const bytes = Utilities.base64Decode(String(data.attachment));
      mail.attachments = [
        Utilities.newBlob(bytes, String(data.attachmentType), String(data.attachmentName)),
      ];
    }

    MailApp.sendEmail(mail);

    MailApp.sendEmail({
      to: email,
      subject: "Hydro-inspect",
      body: "Вашето запитване беше изпратено успешно!",
      name: "Хидроинспект",
      replyTo: "hydroinspect@gmail.com",
    });

    return json_({ success: true });
  } catch (err) {
    return json_({ success: false, message: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: "hydro-inspect-confirm" });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
