$(function () {
    var WORDS_PER_DAY = 5;

    var wordBank = [
        "ALGORITHM", "APPLICATION", "BINARY", "BROWSER", "CLIENT",
        "COMMAND", "COMPUTER", "PROGRAM", "DASHBOARD", "DESKTOP",
        "FIREWALL", "FIRMWARE", "GRAPHICS", "HARDWARE", "JAVASCRIPT",
        "PLATFORM", "QWERTY", "SUPERCOMPUTER", "SYNTAX", "TERMINAL",
        "DATABASE", "ENCRYPTION", "ETHERNET", "FUNCTION", "INTERNET",
        "KEYBOARD", "MAINFRAME", "NETWORK", "PROCESSOR", "VARIABLE",
        "BANDWIDTH", "BLUETOOTH", "BOOLEAN", "CACHE", "COMPILER",
        "CONSOLE", "COOKIE", "CYBER", "DEBUGGER", "DEFAULT",
        "DEVELOPER", "DIGITAL", "DOMAIN", "DOWNLOAD", "DRIVER",
        "ELEMENT", "EMULATOR", "ENCODER", "ENDPOINT", "EXPLOIT",
        "FRAMEWORK", "FRONTEND", "BACKEND", "GATEWAY", "GIGABYTE",
        "HASHTAG", "HOSTING", "HYPERLINK", "INTEGER", "INTERFACE",
        "ITERATION", "KERNEL", "LATENCY", "LIBRARY", "LINUX",
        "LOCALHOST", "MALWARE", "MEMORY", "METADATA", "MICROCHIP",
        "MONITOR", "MOTHERBOARD", "NAMESPACE", "NODE", "OBJECT",
        "OFFLINE", "ONLINE", "OPCODE", "OPERAND", "OPERATOR",
        "OPTICAL", "OUTPUT", "PACKAGE", "PACKET", "PARAMETER",
        "PASSWORD", "PAYLOAD", "PIXEL", "PLUGIN", "POINTER",
        "PORTAL", "PROTOCOL", "PROXY", "PYTHON", "QUERY",
        "RANDOM", "REACTOR", "RECURSION", "REGISTER", "RENDER",
        "REPOSITORY", "REQUEST", "RESPONSE", "ROUTER", "RUNTIME",
        "SANDBOX", "SCANNER", "SCRIPT", "SCROLL", "SECURITY",
        "SELECTOR", "SERVER", "SESSION", "SHORTCUT", "SILICON",
        "SOFTWARE", "STORAGE", "STREAM", "STRING", "SUBNET"
    ];

    // ---- Date & Deterministic Daily Seed ----
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, "0");
    var dd = String(today.getDate()).padStart(2, "0");
    var todayKey = yyyy + "-" + mm + "-" + dd;
    var seed = yyyy * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    function seededRandom() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    }

    var dailyWords = wordBank.slice();
    for (var i = dailyWords.length - 1; i > 0; i--) {
        var j = Math.floor(seededRandom() * (i + 1));
        var temp = dailyWords[i];
        dailyWords[i] = dailyWords[j];
        dailyWords[j] = temp;
    }
    dailyWords = dailyWords.slice(0, WORDS_PER_DAY);

    function scrambleWord(word) {
        var letters = word.split("");
        var scrambled = word;
        var attempts = 0;
        while (scrambled === word && attempts < 10) {
            for (var i = letters.length - 1; i > 0; i--) {
                var j = Math.floor(seededRandom() * (i + 1));
                var tmp = letters[i];
                letters[i] = letters[j];
                letters[j] = tmp;
            }
            scrambled = letters.join("");
            attempts++;
        }
        return scrambled;
    }

    var scrambledList = dailyWords.map(scrambleWord);
    dailyWords.push("nocans");
    scrambledList.push("ALL DONE FOR TODAY!");

    // ---- Cookie Helpers ----
    function getHistory() {
        var match = document.cookie.match(/(?:^|;\s*)wordgame_history=([^;]*)/);
        if (!match) return {};
        try {
            return JSON.parse(decodeURIComponent(match[1]));
        } catch (e) {
            return {};
        }
    }

    function saveTodayResult(points, hints, misses) {
        var history = getHistory();
        // Keep the best score if replayed on the same day
        if (!history[todayKey] || points > history[todayKey].points) {
            history[todayKey] = {
                points: points,
                hints: hints,
                misses: misses
            };
        }
        // Keep only the last 30 days to stay well within cookie size limits
        var keys = Object.keys(history).sort();
        while (keys.length > 30) {
            delete history[keys.shift()];
        }
        document.cookie = "wordgame_history=" + encodeURIComponent(JSON.stringify(history)) +
            ";max-age=31536000;path=/;SameSite=Lax";
        return history;
    }

    // ---- Game State ----
    var num = 0;
    var numscore = 0;
    var hintsUsed = 0;
    var wrongGuesses = 0;
    var hintShownForCurrent = false;

    var $score = $("#score");
    var $scrambled = $("#scrambled");
    var $hintDisplay = $("#hint-display");
    var $summary = $("#daily-summary");

    $score.text("Daily Progress: 0 / " + WORDS_PER_DAY);
    $scrambled.text(scrambledList[0]);

    // ---- Hint Button ----
    $("#hint-btn").on("click", function () {
        if (dailyWords[num] === "nocans") return;
        var word = dailyWords[num];
        if (!hintShownForCurrent) {
            hintsUsed++;
            hintShownForCurrent = true;
        }
        $hintDisplay.text("Hint: Starts with '" + word.charAt(0) + "' (" + word.length + " letters)");
    });

    // ---- End-of-Day Summary & Comparison ----
    function showEndOfDaySummary() {
        // Calculate performance score out of 100 (20 pts per word, -3 per hint, -2 per wrong guess)
        var finalPoints = Math.max(0, (numscore * 20) - (hintsUsed * 3) - (wrongGuesses * 2));
        var rating = finalPoints >= 90 ? "Word Master!" :
                     finalPoints >= 75 ? "Great Job!" :
                     finalPoints >= 50 ? "Solid Effort!" : "Keep Practicing!";

        var history = saveTodayResult(finalPoints, hintsUsed, wrongGuesses);
        var pastDates = Object.keys(history).filter(function (d) { return d !== todayKey; }).sort();

        var comparisonHtml = "";
        if (pastDates.length === 0) {
            comparisonHtml = "<br>This is your <strong>first recorded day</strong>! Come back tomorrow to compare your streak and score.";
        } else {
            var totalPast = 0;
            var bestPast = 0;
            pastDates.forEach(function (d) {
                totalPast += history[d].points;
                if (history[d].points > bestPast) bestPast = history[d].points;
            });
            var avgPast = Math.round(totalPast / pastDates.length);
            var lastDay = pastDates[pastDates.length - 1];
            var lastScore = history[lastDay].points;
            var diff = finalPoints - avgPast;
            var diffText = diff > 0 ? "+" + diff + " pts above your average!" :
                           diff < 0 ? Math.abs(diff) + " pts below your average." :
                           "Right on your daily average!";

            comparisonHtml =
                "<br><strong>Past " + pastDates.length + " Day(s) Comparison:</strong>" +
                "<br>Your Average: <strong>" + avgPast + "/100</strong> (" + diffText + ")" +
                "<br>Previous Day (" + lastDay + "): <strong>" + lastScore + "/100</strong> | All-Time Best: <strong>" + Math.max(bestPast, finalPoints) + "/100</strong>";
        }

        $summary.html(
            "<strong>Today's Score: " + finalPoints + " / 100 — " + rating + "</strong>" +
            "<br>Words Solved: " + numscore + "/" + WORDS_PER_DAY + " | Hints Used: " + hintsUsed + " | Wrong Guesses: " + wrongGuesses +
            comparisonHtml
        ).fadeIn();
    }

    // ---- Answer Check ----
    var check = function (userGuess, correctWord) {
        if (userGuess === correctWord) {
            num++;
            numscore++;
            hintShownForCurrent = false;
            $hintDisplay.text("");
            $scrambled.text(scrambledList[num]);
            $score.text("Daily Progress: " + numscore + " / " + WORDS_PER_DAY);

            if (dailyWords[num] === "nocans") {
                $("#answer, #btn, #hint-btn").prop("disabled", true);
                $("#joke-result").text("DAILY CHALLENGE COMPLETE!").css("color", "#6ee7b7");
                showEndOfDaySummary();
                return;
            }

            return $("#joke-result").text("YOU GOT IT!").css("color", "#6ee7b7");
        } else {
            wrongGuesses++;
            return $("#joke-result").text("Try again!").css("color", "#fda4af");
        }
    };

    $("#joke-form").on("submit", function (event) {
        event.preventDefault();
        if (dailyWords[num] === "nocans") return;

        var $answer = $("#answer");
        var answer = $answer.val().trim().toLowerCase();
        if (!answer) return;

        var answersh = dailyWords[num].toLowerCase();
        check(answer, answersh);
        $answer.val("");
    });
});
