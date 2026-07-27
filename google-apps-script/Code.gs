/**
 * Hydro-inspect contact handler
 * - Saves attachment to Drive
 * - Sends notification via Web3Forms (inbox shows "Хидроинспект", not "me")
 * - Sends confirmation to the visitor
 *
 * Deploy:
 * 1. Paste into Code.gs (hydroinspect@gmail.com)
 * 2. Deploy → Manage deployments → Edit → New version → Deploy
 * 3. Who has access: Anyone
 * 4. Authorize Drive + Gmail when prompted
 */
var WEB3FORMS_ACCESS_KEY = "3f00e71d-0b22-4d02-be8e-e80a3ae777a9";
var UPLOAD_FOLDER_NAME = "Hydro-inspect uploads";
var BUSINESS_EMAIL = "hydroinspect@gmail.com";

function doPost(e) {
  try {
    var data = JSON.parse((e.postData && e.postData.contents) || "{}");
    var name = String(data.name || "").trim();
    var phone = String(data.phone || "").trim();
    var email = String(data.email || "").trim();
    var message = String(data.message || "").trim();

    if (!email) {
      return json_({ success: false, message: "Missing email" });
    }

    var fileUrl = "";
    var fileName = "";

    if (data.attachment && data.attachmentName && data.attachmentType) {
      var bytes = Utilities.base64Decode(String(data.attachment));
      var blob = Utilities.newBlob(
        bytes,
        String(data.attachmentType),
        String(data.attachmentName)
      );
      var folder = getUploadFolder_();
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = file.getUrl();
      fileName = file.getName();
    }

    var payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: "Хидроинспект — ново запитване",
      from_name: "Хидроинспект",
      replyto: email,
      Име: name,
      Телефон: phone,
      Имейл: email,
      Съобщение: message,
    };

    if (fileUrl) {
      payload["Прикачен файл"] = fileUrl;
      payload["Име на файла"] = fileName;
    }

    var w3 = UrlFetchApp.fetch("https://api.web3forms.com/submit", {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    var w3Code = w3.getResponseCode();
    var w3Body = {};
    try {
      w3Body = JSON.parse(w3.getContentText() || "{}");
    } catch (parseErr) {
      w3Body = {};
    }

    if (w3Code >= 300 || w3Body.success === false) {
      return json_({
        success: false,
        message: w3Body.message || ("Web3Forms error " + w3Code),
      });
    }

    // Confirmation to visitor — different recipient, so name shows as Хидроинспект
    GmailApp.sendEmail(
      email,
      "Хидроинспект — запитването е получено",
      "Вашето запитване беше изпратено успешно!",
      {
        name: "Хидроинспект",
        replyTo: BUSINESS_EMAIL,
      }
    );

    return json_({ success: true });
  } catch (err) {
    return json_({ success: false, message: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: "hydro-inspect-mailer" });
}

function getUploadFolder_() {
  var folders = DriveApp.getFoldersByName(UPLOAD_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(UPLOAD_FOLDER_NAME);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
