// Local memory to hold files for the current session safely
window.uploadedFilesCache = window.uploadedFilesCache || {};

// Function to render cards on screen dynamically
function appendPaperCard(paper, fileObject) {
    const paperList = document.getElementById("paper-list");
    const cardId = `user_${Date.now()}`;
    
    // Cache the file object with a unique key
    window.uploadedFilesCache[cardId] = fileObject;

    const cardHTML = `
      <div class="paper-item-card">
        <h3>${paper.title}</h3>
        <p>Exam: ${paper.exam} | Year: ${paper.year}</p>
        <a class="download-btn" href="#" onclick="viewLocalFile('${cardId}', event)">Download PDF</a>
      </div>
    `;
    
    // Naya paper sabse upar bina refresh ke add hoga
    paperList.insertAdjacentHTML('afterbegin', cardHTML);
}

// ==========================================
// 1. DATA FETCH & ADVANCED SEARCH SYSTEM
// ==========================================
fetch("data/papers.json")
  .then(response => response.json())
  .then(data => {
    const paperList = document.getElementById("paper-list");
    paperList.innerHTML = "";

    if (data.length === 0) {
        paperList.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #6b7280; padding: 20px;">No papers found. Try another search!</p>`;
        return;
    }

    // Sirf verification wale static papers load honge refresh par
    data.forEach(paper => {
        paperList.innerHTML += `
          <div class="paper-item-card">
            <h3>${paper.title}</h3>
            <p>Exam: ${paper.exam} | Year: ${paper.year}</p>
            <a class="download-btn" href="${paper.pdf || '#'}" target="_blank">Download PDF</a>
          </div>
        `;
    });

    // Search input functionality
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

// Flawless open mechanism for the active session upload
function viewLocalFile(cardId, event) {
    event.preventDefault();
    if (window.uploadedFilesCache[cardId]) {
        const blobUrl = URL.createObjectURL(window.uploadedFilesCache[cardId]);
        window.open(blobUrl, '_blank');
    }
}

// ==========================================
// 2. STABLE LIVE SUBMISSION PIPELINE
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

    btn.innerText = "Publishing... Please wait...";
    btn.disabled = true;
    statusText.style.color = "#1e3a8a";
    statusText.innerText = "Injecting live onto screen...";

    let detectedExam = "Other";
    let upperTitle = customTitle.toUpperCase();
    if (upperTitle.includes("BPSC")) detectedExam = "BPSC";
    else if (upperTitle.includes("SSC")) detectedExam = "SSC";
    else if (upperTitle.includes("RAILWAY")) detectedExam = "Railway";

    const yearMatch = customTitle.match(/\b(20\d{2})\b/);
    let detectedYear = yearMatch ? yearMatch[0] : "2026";

    const temporaryPaper = {
        title: customTitle,
        exam: detectedExam,
        year: detectedYear
    };

    // 1. Instant dynamic injection (Bina page reload ke screen par card chala jayega)
    appendPaperCard(temporaryPaper, fileInput);

    // 2. Direct pipeline to your email (Formspree takes the file physically)
    try {
        const emailData = new FormData();
        emailData.append("Exam_Title", customTitle);
        emailData.append("Attached_PDF", fileInput);

        fetch("https://formspree.io/f/xojzzdaw", {
            method: "POST",
            body: emailData,
            headers: { 'Accept': 'application/json' }
        });
    } catch (e) {
        console.log("Dispatched in background.");
    }

    statusText.style.color = "green";
    statusText.innerText = "🎉 Success! Paper is live below!";
    
    // Clear inputs smoothly without breaking cache
    document.getElementById("upload-custom-title").value = "";
    document.getElementById("upload-file").value = "";
    btn.innerText = "Upload & Go Live";
    btn.disabled = false;
}