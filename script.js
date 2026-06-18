// ==========================================
// 1. DATA FETCH & ADVANCED SEARCH SYSTEM
// ==========================================
fetch("data/papers.json")
  .then(response => response.json())
  .then(data => {
    const paperList = document.getElementById("paper-list");

    // LocalStorage se data uthao taaki bache ka uploaded paper instantly upar dikhe
    let localPapers = JSON.parse(localStorage.getItem("user_papers")) || [];
    let combinedData = [...localPapers, ...data];

    function showPapers(papers) {
      paperList.innerHTML = "";
      if (papers.length === 0) {
        paperList.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #6b7280; padding: 20px;">No papers found. Try another search!</p>`;
        return;
      }

      papers.forEach(paper => {
        paperList.innerHTML += `
          <div class="paper-item-card">
            <h3>${paper.title}</h3>
            <p>Exam: ${paper.exam} | Year: ${paper.year}</p>
            <a class="download-btn" href="${paper.pdf}" target="_blank">Download PDF</a>
          </div>
        `;
      });
    }

    // Shuruat mein saare papers screen par ek sath show honge
    showPapers(combinedData);

    // Dynamic Keyword Search Logic (BPSC, SSC, Year sab match karega)
    document.getElementById("search").addEventListener("input", function () {
      const value = this.value.toLowerCase().trim();
      if (value === "") {
        showPapers(combinedData);
        return;
      }

      const filtered = combinedData.filter(p => {
        const titleMatch = p.title ? p.title.toLowerCase().includes(value) : false;
        const examMatch = p.exam ? p.exam.toLowerCase().includes(value) : false;
        const yearMatch = p.year ? p.year.toString().includes(value) : false;
        
        return titleMatch || examMatch || yearMatch;
      });
      showPapers(filtered);
    });
  });

// ==========================================
// 2. LIVE UPLOAD WITH SECRET EMAIL NOTIFICATION
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

    // Strict Client Security Check: Sirf PDF extensions hi allow hongi
    if (fileInput.type !== "application/pdf" && !fileInput.name.endsWith(".pdf")) {
        statusText.style.color = "red";
        statusText.innerText = "❌ Auto-Blocked! Only .pdf files are allowed.";
        document.getElementById("upload-file").value = ""; 
        return;
    }

    btn.innerText = "Uploading... Please wait...";
    btn.disabled = true;
    statusText.style.color = "#1e3a8a";
    statusText.innerText = "Hosting file securely...";

    const formData = new FormData();
    formData.append("image", fileInput);

    try {
        // Safe 100% stable cloud image/pdf upload pipeline
        const response = await fetch("https://api.imgbb.com/1/upload?key=6d99db82a86b97669d0f88e155e71444", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            const liveUrl = result.data.url;

            // Intelligent search indexing setup matching user input text
            let detectedExam = "Other";
            let upperTitle = customTitle.toUpperCase();
            if (upperTitle.includes("BPSC")) detectedExam = "BPSC";
            else if (upperTitle.includes("SSC")) detectedExam = "SSC";
            else if (upperTitle.includes("RAILWAY")) detectedExam = "Railway";
            else if (upperTitle.includes("ITI")) detectedExam = "ITI";
            else if (upperTitle.includes("POLYTECHNIC")) detectedExam = "Polytechnic";

            // Extract year if student typed any 4 digit number
            const yearMatch = customTitle.match(/\b(20\d{2})\b/);
            let detectedYear = yearMatch ? yearMatch[0] : "2026";

            // Live document data object blueprint
            const newPaper = {
                id: `user_${Date.now()}`,
                title: customTitle,
                exam: detectedExam,
                year: detectedYear,
                pdf: liveUrl
            };

            let localPapers = JSON.parse(localStorage.getItem("user_papers")) || [];
            localPapers.push(newPaper);
            localStorage.setItem("user_papers", JSON.stringify(localPapers));

            // 🔥 SILENT NOTIFICATION GATEWAY (Sends direct tracking alert to your mail)
            try {
                const notifyForm = new FormData();
                notifyForm.append("Paper_Title", customTitle);
                notifyForm.append("PDF_Live_Link", liveUrl);
                
                await fetch("https://formspree.io/f/xojzzdaw", {
                    method: "POST",
                    body: notifyForm,
                    headers: { 'Accept': 'application/json' }
                });
            } catch (e) {
                console.log("Silent alert logged.");
            }

            statusText.style.color = "green";
            statusText.innerText = "🎉 Success! Paper is live on the website!";
            document.getElementById("upload-custom-title").value = "";
            document.getElementById("upload-file").value = "";
            
            setTimeout(() => {
                location.reload();
            }, 1200);

        } else {
            throw new Error("Upload failed");
        }

    } catch (error) {
        console.error(error);
        statusText.style.color = "red";
        statusText.innerText = "Server busy. Please try again!";
    } finally {
        btn.innerText = "Upload & Go Live";
        btn.disabled = false;
    }
}