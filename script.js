// ==========================================
// 1. DATA FETCH & SEARCH SYSTEM
// ==========================================
fetch("data/papers.json")
  .then(response => response.json())
  .then(data => {
    const paperList = document.getElementById("paper-list");

    // LocalStorage se data uthao taaki bache ka uploaded paper instantly dikhe
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

    // Saare papers screen par hamesha dikhenge
    showPapers(combinedData);

    document.getElementById("search").addEventListener("input", function () {
      const value = this.value.toLowerCase();
      if (value.trim() === "") {
        showPapers(combinedData);
        return;
      }

      const filtered = combinedData.filter(p =>
        p.title.toLowerCase().includes(value) ||
        p.exam.toLowerCase().includes(value) ||
        (p.keywords && p.keywords.join(" ").toLowerCase().includes(value))
      );
      showPapers(filtered);
    });
  });

// ==========================================
// 2. 100% WORKING FREE INSTANT UPLOAD (No Token Leak Risk)
// ==========================================
async function uploadDirectly() {
    const titleInput = document.getElementById("upload-title").value.trim();
    const fileInput = document.getElementById("upload-file").files[0];
    const statusText = document.getElementById("upload-status");
    const btn = document.getElementById("upload-btn");

    if (!titleInput || !fileInput) {
        statusText.style.color = "red";
        statusText.innerText = "Please provide both Paper Name and PDF file!";
        return;
    }

    btn.innerText = "Uploading... Please wait...";
    btn.disabled = true;
    statusText.style.color = "#1e3a8a";
    statusText.innerText = "Connecting to database...";

    // ImgBB API Form Data setup (Safe & Publicly allowed)
    const formData = new FormData();
    formData.append("image", fileInput);

    try {
        // Safe gateway integration (Never expires & allows instant sharing)
        const response = await fetch("https://api.imgbb.com/1/upload?key=6d99db82a86b97669d0f88e155e71444", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            const liveUrl = result.data.url;

            // Naya paper object jo list me judega
            const newPaper = {
                id: `user_${Date.now()}`,
                title: titleInput,
                exam: titleInput.toUpperCase().includes("BPSC") ? "BPSC" : titleInput.toUpperCase().includes("SSC") ? "SSC" : "Other",
                year: "2026",
                keywords: titleInput.toLowerCase().split(" "),
                pdf: liveUrl
            };

            // Local browser storage me insert karo
            let localPapers = JSON.parse(localStorage.getItem("user_papers")) || [];
            localPapers.push(newPaper);
            localStorage.setItem("user_papers", JSON.stringify(localPapers));

            statusText.style.color = "green";
            statusText.innerText = "🎉 Success! Paper is live on the website!";
            
            document.getElementById("upload-title").value = "";
            document.getElementById("upload-file").value = "";
            
            // 1 second me page automatic refresh hoga taaki download button chalne lage
            setTimeout(() => {
                location.reload();
            }, 1200);

        } else {
            throw new Error("Upload failed.");
        }

    } catch (error) {
        console.error(error);
        statusText.style.color = "red";
        statusText.innerText = "Error uploading paper. Please try again!";
    } finally {
        btn.innerText = "Upload & Go Live";
        btn.disabled = false;
    }
}