/**
 * Hydro-inspect — receive form + optional file, email via Web3Forms.
 * Drive upload is best-effort; email is always sent.
 *
 * Deploy: Edit Code.gs → Deploy → Manage deployments → New version → Anyone
 */
var WEB3FORMS_ACCESS_KEY = "3f00e71d-0b22-4d02-be8e-e80a3ae777a9";
var UPLOAD_FOLDER_NAME = "Hydro-inspect uploads";

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
      try {
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
      } catch (driveErr) {
        fileUrl = "";
        fileName = String(data.attachmentName || "");
      }
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
    } else if (data.attachmentName) {
      payload["Прикачен файл"] =
        "Файлът не можа да се качи в Drive. Име: " + String(data.attachmentName);
    }

    var w3 = UrlFetchApp.fetch("https://api.web3forms.com/submit", {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    var code = w3.getResponseCode();
    var body = {};
    try {
      body = JSON.parse(w3.getContentText() || "{}");
    } catch (ignore) {
      body = {};
    }

    if (code >= 300 || body.success === false) {
      return json_({ success: false, message: body.message || ("Web3Forms " + code) });
    }

    return json_({ success: true, fileUrl: fileUrl || null });
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
