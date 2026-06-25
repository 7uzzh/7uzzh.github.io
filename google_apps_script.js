// =========================================================================
// GOOGLE APPS SCRIPT BACKEND FOR PYQHub (100% Free Hosting)
// =========================================================================
// Instructions to set this up:
// 1. Create a new Google Sheet in your Google Drive. Name it "PYQ Database".
// 2. Click "Extensions" in the top menu -> "Apps Script".
// 3. Delete any code in the editor, paste this entire code, and save (Ctrl+S).
// 4. Click the blue "Deploy" button (top right) -> "New deployment".
// 5. Select type: "Web app".
// 6. Set configuration:
//    - Description: "PYQ Backend"
//    - Execute as: "Me (your-email@gmail.com)"
//    - Who has access: "Anyone" (Crucial! Otherwise visitors cannot load/upload papers)
// 7. Click "Deploy". Authorize permissions when prompted (click Advanced -> Go to PYQ Database (unsafe)).
// 8. Copy the "Web app URL" and paste it into script.js under GOOGLE_SCRIPT_URL.
// =========================================================================

const SHEET_NAME = "Papers";
const ADMIN_PASSWORD = "Admin123@"; // Change this if you want a different password!

function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return jsonResponse([]);
    }
    
    const headers = data[0];
    const papers = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const paper = {};
      for (let j = 0; j < headers.length; j++) {
        const key = headers[j];
        let val = row[j];
        if (key === 'keywords') {
          try {
            val = JSON.parse(val);
          } catch(e) {
            val = val.toString().split(',').map(s => s.trim());
          }
        }
        paper[key] = val;
      }
      papers.push(paper);
    }
    
    // Sort so latest uploads are first
    papers.reverse();
    
    return jsonResponse(papers);
  } catch(err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    if (action === 'delete') {
      return handleDelete(postData);
    } else if (action === 'verify') {
      return handleVerify(postData);
    }
    
    return handleUpload(postData);
  } catch(err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function handleVerify(data) {
  const { password } = data;
  if (!password) {
    return jsonResponse({ success: false, message: "Missing password parameter" });
  }
  if (password !== ADMIN_PASSWORD) {
    return jsonResponse({ success: false, message: "Invalid admin password" });
  }
  return jsonResponse({ success: true, message: "Password verified successfully" });
}

function handleUpload(data) {
  const { title, exam, year, fileName, pdfData } = data;
  
  let base64Data = pdfData;
  if (pdfData.indexOf(',') !== -1) {
    base64Data = pdfData.split(',')[1];
  }
  
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'application/pdf', fileName);
  
  // Get or create "PYQ_Uploads" Folder in Google Drive
  const folders = DriveApp.getFoldersByName("PYQ_Uploads");
  let folder;
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder("PYQ_Uploads");
  }
  
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  // Convert standard share link to direct download link
  const fileId = file.getId();
  const pdfUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
  const paperId = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/\.pdf$/i, '').toLowerCase();
  
  const cleanTitle = title.trim();
  const keywords = cleanTitle.toLowerCase().replace(/[-_]/g, ' ').split(/\s+/).filter(w => w.length > 1);
  const uploadedAt = new Date().toISOString();
  
  const sheet = getOrCreateSheet();
  // Headers check
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["id", "title", "exam", "year", "pdf", "uploadedAt", "keywords", "fileId"]);
  }
  
  sheet.appendRow([
    paperId,
    cleanTitle,
    exam,
    year,
    pdfUrl,
    uploadedAt,
    JSON.stringify(keywords),
    fileId
  ]);
  
  const newPaper = {
    id: paperId,
    title: cleanTitle,
    exam: exam,
    year: year,
    pdf: pdfUrl,
    uploadedAt: uploadedAt,
    keywords: keywords
  };
  
  return jsonResponse({ success: true, paper: newPaper });
}

function handleDelete(data) {
  const { id, password } = data;
  
  if (password !== ADMIN_PASSWORD) {
    return jsonResponse({ success: false, message: "Invalid admin password" });
  }
  
  const sheet = getOrCreateSheet();
  const values = sheet.getDataRange().getValues();
  let rowToDelete = -1;
  let fileId = "";
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      rowToDelete = i + 1; // 1-indexed for sheets
      fileId = values[i][7]; // fileId is 8th column
      break;
    }
  }
  
  if (rowToDelete === -1) {
    return jsonResponse({ success: false, message: "Paper not found in sheet database" });
  }
  
  // Delete from Google Drive if fileId exists
  if (fileId) {
    try {
      const file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
    } catch(err) {
      console.log("Could not delete file from drive:", err);
    }
  }
  
  // Delete row from Sheet
  sheet.deleteRow(rowToDelete);
  
  return jsonResponse({ success: true, message: "Paper deleted successfully" });
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["id", "title", "exam", "year", "pdf", "uploadedAt", "keywords", "fileId"]);
  }
  return sheet;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
