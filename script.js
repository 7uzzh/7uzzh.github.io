// Session memory cache to hold actual files perfectly without losing them
window.uploadedFilesCache = window.uploadedFilesCache || {};

// Main function to render cards dynamically
function appendPaperCard(paper) {
    const paperList = document.getElementById("paper-list");
    let isUserUploaded = paper.id && paper.id.toString().startsWith("user_");
    
    let actionAttribute = isUserUploaded 
      ? `href="#" onclick="viewLocalFile('${paper.id}', event)"` 
      : `href="${paper.pdf || '#'}" target="_blank"`;

    const cardHTML = `
      <div class="paper-item-card" id="card-${paper.id}">
        <h3>${paper.title}</h3>
        <p>Exam: ${paper.exam} | Year: ${paper.year}</p>
        <a class="download-btn" ${actionAttribute}>Download PDF</a>
      </div>
    `;
    
    // Naya uploaded paper hamesha sabse upar dikhega
    paperList.insertAdjacentHTML('afterbegin', cardHTML);
}

// ==========================================
// 1. DATA FETCH & ADVANCED SEARCH SYSTEM
// ==========================================
fetch("data/papers.json")
  .then(response => response.json())
  .then(data => {
    // LocalStorage metadata handle karo
    let localPapers = JSON.parse(localStorage.getItem("user_papers")) || [];
    
    // Pehle se padi memory rendering clear karke load karo
    document.getElementById("paper-list").innerHTML = "";

    // Purane global standard JSON papers load karo
    data.forEach(paper => {
        const paperList = document.getElementById("paper-list");
        paperList.innerHTML += `
          <div class="paper-item-card">
            <h3>${paper.title}</h3>
            <p>Exam: ${paper.exam} | Year: ${paper.year}</p>
            <a class="download-btn" href="${paper.pdf || '#'}" target="_blank">Download PDF</a>
          </div>
        `;
    });

    // Local submissions display back tracking (Sirf temporary preview dikhane ke liye)
    localPapers.forEach(paper => {
        appendPaperCard(paper);
    });

    // Instant Keyword Filter Match
    document.getElementById("search").addEventListener("input", function () {
      const value = this.value.toLowerCase().trim();
      const cards = document.querySelectorAll(".paper-item-card");

      cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        if (text.includes(value) || value === "") {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
      });
    });
  });

// Open cached temporary document links flawlessly
function viewLocalFile(paperId, event) {
    event.preventDefault();
    if (window.uploadedFilesCache[paperId]) {
        const blobUrl = URL.createObjectURL(window.uploadedFilesCache[paperId]);
        window.open(blobUrl, '_blank');
    } else {
        alert("Session cleared. Please re-select the PDF file to preview it again!");
    }
}

// ==========================================
// 2. ULTRA-SMOOTH NO-RELOAD INJECTION PIPELINE
// ==========================================
async function uploadDirectly() {
    const customTitle = document.getElementById("upload-custom-title").value.trim();
    const fileInput = document.getElementById("upload-file").files[0];
    const statusText = document.getElementById("upload-status");
    const btn = document.getElementById("upload-btn");

    if (!customTitle || !fileInput) {
        statusText.style.color = "red";
        statusText.innerText = "Please fill in the exam details and select a PDF!";
        return;
    }

    if (fileInput.type !== "application/pdf" && !fileInput.name.endsWith(".pdf")) {
        statusText.style.color = "red";
        statusText.innerText = "❌ Only .pdf files are allowed.";
        document.getElementById("upload-file").value = ""; 
        return;
    }

    btn.innerText = "Adding... Please wait...";
    btn.disabled = true;
    statusText.style.color = "#1e3a8a";
    statusText.innerText = "Injecting live into list...";

    const paperId = `user_${Date.now()}`;

    // Lock file reference directly into browser session stack (No loss)
    window.uploadedFilesCache[paperId] = fileInput;

    let detectedExam = "Other";
    let upperTitle = customTitle.toUpperCase();
    if (upperTitle.includes("BPSC")) detectedExam = "BPSC";
    else if (upperTitle.includes("SSC")) detectedExam = "SSC";
    else if (upperTitle.includes("RAILWAY")) detectedExam = "Railway";

    const yearMatch = customTitle.match(/\b(20\d{2})\b/);
    let detectedYear = yearMatch ? yearMatch[0] : "2026";

    const newPaper = {
        id: paperId,
        title: customTitle,
        exam: detectedExam,
        year: detectedYear
    };

    // Save tracking details
    let localPapers = JSON.parse(localStorage.getItem("user_papers")) || [];
    localPapers.push(newPaper);
    localStorage.setItem("user_papers", JSON.stringify(localPapers));

    // Dynamic direct injection onto DOM (0.001 seconds display jump)
    appendPaperCard(newPaper);

    // Silent Formspree background transmission
    try {
        const alertData = new FormData();
        alertData.append("Paper_Title", customTitle);
        alertData.append("Attached_File", fileInput); // Real PDF goes straight to your email inbox!

        fetch("https://formspree.io/f/xojzzdaw", {
            method: "POST",
            body: alertData,
            headers: { 'Accept': 'application/json' }
        });
    } catch (e) {
        console.log("Background link dispatched.");
    }

    statusText.style.color = "green";
    statusText.innerText = "🎉 Success! Paper added live below instantly!";
    
    // Clear elements cleanly without any page reload
    document.getElementById("upload-custom-title").value = "";
    document.getElementById("upload-file").value = "";
    btn.innerText = "Upload & Go Live";
    btn.disabled = false;
}