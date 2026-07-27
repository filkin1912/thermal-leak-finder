/**
 * Hydro-inspect — upload only (returns Drive share link).
 * Emails are sent by the website via Web3Forms (sender: Хидроинспект).
 *
 * Deploy:
 * 1. Paste into Code.gs (hydroinspect@gmail.com)
 * 2. Deploy → Manage deployments → Edit → New version → Deploy
 * 3. Who has access: Anyone
 * 4. Allow Drive permission when asked
 */
var UPLOAD_FOLDER_NAME = "Hydro-inspect uploads";

function doPost(e) {
  try {
    var data = JSON.parse((e.postData && e.postData.contents) || "{}");
    var action = String(data.action || "upload");

    if (action !== "upload") {
      return json_({ success: false, message: "Unknown action" });
    }

    if (!data.attachment || !data.attachmentName || !data.attachmentType) {
      return json_({ success: false, message: "Missing attachment" });
    }

    var bytes = Utilities.base64Decode(String(data.attachment));
    var blob = Utilities.newBlob(
      bytes,
      String(data.attachmentType),
      String(data.attachmentName)
    );
    var folder = getUploadFolder_();
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return json_({
      success: true,
      fileUrl: file.getUrl(),
      fileName: file.getName(),
    });
  } catch (err) {
    return json_({ success: false, message: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: "hydro-inspect-upload" });
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
