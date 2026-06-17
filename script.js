=fetch("data/papers.json")
  .then(response => response.json())
  .then(data => {

    const paperList = document.getElementById("paper-list");

    function showPapers(papers) {
      paperList.innerHTML = "";

      // Shuruat mein ya galat search par kuch mat dikhao
      if (papers.length === 0) {
        return;
      }

      papers.forEach(paper => {
        // Yahan .card badal kar .paper-item-card kiya taaki conflict na ho
        paperList.innerHTML += `
          <div class="paper-item-card">
            <h3>${paper.title}</h3>
            <p>Exam: ${paper.exam} | Year: ${paper.year}</p>
            <a class="download-btn" href="${paper.pdf}" target="_blank">Download PDF</a>
          </div>
        `;
      });
    }

    // Pehle se khali rakhein taaki sirf categories dikhein
    showPapers([]);

    document
      .getElementById("search")
      .addEventListener("input", function () {

        const value = this.value.toLowerCase();

        if (value.trim() === "") {
          showPapers([]);
          return;
        }

        const filtered = data.filter(p =>
          p.title.toLowerCase().includes(value) ||
          p.exam.toLowerCase().includes(value) ||
          (p.keywords && p.keywords.join(" ").toLowerCase().includes(value))
        );

        showPapers(filtered);
      });
  });