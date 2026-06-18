// ==========================================
// 1. DATA FETCH & ADVANCED SEARCH SYSTEM
// ==========================================
fetch("data/papers.json")
  .then(response => response.json())
  .then(data => {
    const paperList = document.getElementById("paper-list");

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

    showPapers(combinedData);

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
// 2. ULTRA-SMOOTH DIRECT SUBMIT SYSTEM
// ==========================================
function uploadDirectly() {
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

    // UI Feedback instantly smooth karo
    btn.innerText = "Processing... Please wait...";
    btn.disabled = true;
    statusText.style.color = "#1e3a8a";
    statusText.innerText = "Sending safely to Ankit's Dashboard...";

    // File ko link mein convert karo local display ke liye
    const localViewUrl = URL.createObjectURL(fileInput);

    // Formspree ke liye simple text data pipeline prepare karo
    const reader = new FileReader();
    reader.readAsDataURL(fileInput); // Convert PDF to string instantly
    
    reader.onload = async function () {
        const base64File = reader.result;

        const payload = {
            Paper_Title: customTitle,
            Uploaded_PDF_Data: base64File // Email pe directly text pipeline se attach ho jayega
        };

        try {
            // Formspree Call (No Image/PDF hosting dependency)
            const response = await fetch("https://formspree.io/f/xojzzdaw", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                let detectedExam = "Other";
                let upperTitle = customTitle.toUpperCase();
                if (upperTitle.includes("BPSC")) detectedExam = "BPSC";
                else if (upperTitle.includes("SSC")) detectedExam = "SSC";
                else if (upperTitle.includes("RAILWAY")) detectedExam = "Railway";

                const yearMatch = customTitle.match(/\b(20\d{2})\b/);
                let detectedYear = yearMatch ? yearMatch[0] : "2026";

                const newPaper = {
                    id: `user_${Date.now()}`,
                    title: customTitle,
                    exam: detectedExam,
                    year: detectedYear,
                    pdf: localViewUrl
                };

                let localPapers = JSON.parse(localStorage.getItem("user_papers")) || [];
                localPapers.push(newPaper);
                localStorage.setItem("user_papers", JSON.stringify(localPapers));

                statusText.style.color = "green";
                statusText.innerText = "🎉 Success! Paper sent and live on your screen!";
                
                document.getElementById("upload-custom-title").value = "";
                document.getElementById("upload-file").value = "";
                
                setTimeout(() => {
                    location.reload();
                }, 1000);

            } else {
                throw new Error("Submission rejected");
            }

        } catch (error) {
            console.error(error);
            statusText.style.color = "red";
            statusText.innerText = "Network busy. Please click upload again!";
        } finally {
            btn.innerText = "Upload & Go Live";
            btn.disabled = false;
        }
    };
}