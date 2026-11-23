$(function () {
    const VALUES = new Array(100, 200, 300, 400, 500);
    const NUM_COLS = 5;
    const NUM_ROWS = 5;
    const PLAYER_URL = "https://github.io";

    const $grid = $("#board-grid");

    // 1. Build the 5 Category Columns and 25 Clue/Answer Input Cards
    for (let col = 0; col < NUM_COLS; col++) {
        const $colDiv = $("<div>").addClass("category-col");

        const $catLabel = $("<label>")
            .attr("for", `cat-${col}`)
            .text(`Category ${col + 1}`);

        const $catInput = $("<input>")
            .attr({
                type: "text",
                id: `cat-${col}`,
                placeholder: `Category ${col + 1} Title`,
                required: true
            })
            .addClass("cat-input");

        $colDiv.append($catLabel, $catInput);

        for (let row = 0; row < NUM_ROWS; row++) {
            const $clueCard = $("<div>").addClass("clue-card");
            const $pointBadge = $("<span>").addClass("point-badge").text(`$${VALUES[row]}`);

            const $qInput = $("<input>")
                .attr({
                    type: "text",
                    id: `q-${col}-${row}`,
                    placeholder: "Question / Clue",
                    required: true
                })
                .addClass("q-input");

            const $aInput = $("<input>")
                .attr({
                    type: "text",
                    id: `a-${col}-${row}`,
                    placeholder: "Correct Answer",
                    required: true
                })
                .addClass("a-input");

            $clueCard.append($pointBadge, $qInput, $aInput);
            $colDiv.append($clueCard);
        }

        $grid.append($colDiv);
    }

    // 2. Fill Sample Data Button (for easy testing)
    $("#fill-sample-btn").on("click", function () {
        $("#game-title").val("General Trivia Challenge");
        const sampleCats = new Array("Science", "History", "Geography", "Coding", "Pop Culture");

        for (let col = 0; col < NUM_COLS; col++) {
            $(`#cat-${col}`).val(sampleCats[col]);
            for (let row = 0; row < NUM_ROWS; row++) {
                $(`#q-${col}-${row}`).val(`${sampleCats[col]} clue for $${VALUES[row]}`);
                $(`#a-${col}-${row}`).val(`${sampleCats[col]} answer $${VALUES[row]}`);
            }
        }
    });

    // 3. Compress Data into [jName, titlestxt, qAndA] and Generate Player Link
    $("#creator-form").on("submit", function (event) {
        event.preventDefault();

        const jName = $("#game-title").val().trim() || "Custom Jeopardy";
        const titlestxt = [];
        const qAndA = [];

        for (let col = 0; col < NUM_COLS; col++) {
            const catTitle = $(`#cat-${col}`).val().trim() || `Category ${col + 1}`;
            titlestxt.push(catTitle);

            const colQuestions = [];
            for (let row = 0; row < NUM_ROWS; row++) {
                const q = $(`#q-${col}-${row}`).val().trim() || "No question";
                const a = $(`#a-${col}-${row}`).val().trim() || "No answer";
                colQuestions.push(new Array(q, a));
            }
            qAndA.push(colQuestions);
        }

        const bank = new Array(jName, titlestxt, qAndA);
        const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(bank));
        const finalLink = `${PLAYER_URL}?g=${compressed}`;

        $("#share-url").val(finalLink);
        $("#play-now-link").attr("href", finalLink);
        $("#output-box").fadeIn();

        $("html, body").animate({
            scrollTop: $("#output-box").offset().top - 20
        }, 300);
    });

    // 4. Copy Link to Clipboard
    $("#copy-btn").on("click", function () {
        const shareInput = document.getElementById("share-url");
        shareInput.select();
        shareInput.setSelectionRange(0, 99999);

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareInput.value);
        } else {
            document.execCommand("copy");
        }

        const $copyBtn = $(this);
        $copyBtn.text("Copied!");
        setTimeout(() => $copyBtn.text("Copy Link"), 2000);
    });
});