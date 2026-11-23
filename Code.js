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

    // ---- Generic Storage Helpers (localStorage + Cookie Fallback) ----
    function readStorage(key) {
        try {
            var localData = localStorage.getItem(key);
            if (localData) return JSON.parse(localData);
        } catch (e) { }

        var regex = new RegExp("(?:^|;\\s*)" + key + "=([^;]*)");
        var match = document.cookie.match(regex);
        if (match && match[1]) {
            try {
                return JSON.parse(decodeURIComponent(match[1]));
            } catch (e) { }
        }
        return null;
    }

    function writeStorage(key, data, maxAgeSeconds) {
        var serialized = JSON.stringify(data);
        try {
            localStorage.setItem(key, serialized);
        } catch (e) { }
        document.cookie = key + "=" + encodeURIComponent(serialized) +
            ";max-age=" + maxAgeSeconds + ";path=/;SameSite=Lax";
    }

    function clearProgress() {
        try {
            localStorage.removeItem("wordgame_progress");
        } catch (e) { }
        document.cookie = "wordgame_progress=;max-age=0;path=/;SameSite=Lax";
    }

    // ---- Completed History Helpers ----
    function getHistory() {
        return readStorage("wordgame_history") || {};
    }

    function saveTodayResult(points, hints, misses) {
        var history = getHistory();
        if (!history[todayKey]) {
            history[todayKey] = {
                points: points,
                hints: hints,
                misses: misses
            };
        }
        var keys = Object.keys(history).sort();
        while (keys.length > 30) {
            delete history[keys.shift()];
        }
        writeStorage("wordgame_history", history, 31536000);
        clearProgress();
        return history;
    }

    // ---- DOM Elements & State ----
    var num = 0;
    var numscore = 0;
    var hintsUsed = 0;
    var wrongGuesses = 0;
    var hintShownForCurrent = false;

    var $score = $("#score");
    var $scrambled = $("#scrambled");
    var $hintDisplay = $("#hint-display");
    var $summary = $("#daily-summary");

    function saveCurrentProgress() {
        writeStorage("wordgame_progress", {
            date: todayKey,
            num: num,
            numscore: numscore,
            hintsUsed: hintsUsed,
            wrongGuesses: wrongGuesses,
            hintShownForCurrent: hintShownForCurrent
        }, 86400);
    }

    // ---- Live Countdown to Midnight ----
    function startMidnightCountdown() {
        function updateCountdown() {
            var now = new Date();
            var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
            var diffMs = midnight - now;

            if (diffMs <= 0) {
                $("#countdown-timer").text("New words are ready! Reload the page to play.");
                return;
            }

            var totalSecs = Math.floor(diffMs / 1000);
            var hrs = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
            var mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
            var secs = String(totalSecs % 60).padStart(2, "0");

            $("#countdown-timer").text("Next words in " + hrs + ":" + mins + ":" + secs);
        }

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    // ---- Render End-of-Day Summary ----
    function renderSummary(points, hints, misses, history) {
        var rating = points >= 90 ? "Word Master!" :
            points >= 75 ? "Great Job!" :
                points >= 50 ? "Solid Effort!" : "Keep Practicing!";

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
            var diff = points - avgPast;
            var diffText = diff > 0 ? "+" + diff + " pts above your average!" :
                diff < 0 ? Math.abs(diff) + " pts below your average." :
                    "Right on your daily average!";

            comparisonHtml =
                "<br><strong>Past " + pastDates.length + " Day(s) Comparison:</strong>" +
                "<br>Your Average: <strong>" + avgPast + "/100</strong> (" + diffText + ")" +
                "<br>Previous Day (" + lastDay + "): <strong>" + lastScore + "/100</strong> | All-Time Best: <strong>" + Math.max(bestPast, points) + "/100</strong>";
        }

        $summary.html(
            "<strong>Today's Score: " + points + " / 100 — " + rating + "</strong>" +
            "<br>Words Solved: " + WORDS_PER_DAY + "/" + WORDS_PER_DAY + " | Hints Used: " + hints + " | Wrong Guesses: " + misses +
            comparisonHtml +
            "<br><br><strong id='countdown-timer'></strong>"
        ).show();

        startMidnightCountdown();
    }

    // ---- 1. Check If Already Completed Today ----
    var existingHistory = getHistory();
    if (existingHistory[todayKey]) {
        var savedToday = existingHistory[todayKey];
        $scrambled.text("COME BACK TOMORROW FOR NEW WORDS!");
        $score.text("Daily Progress: " + WORDS_PER_DAY + " / " + WORDS_PER_DAY);
        $("#joke-result").text("ALREADY COMPLETED TODAY!").css("color", "#6ee7b7");
        $("#answer, #btn, #hint-btn").prop("disabled", true);
        renderSummary(savedToday.points, savedToday.hints, savedToday.misses, existingHistory);
        return;
    }

    // ---- 2. Restore Mid-Game Progress If From Today ----
    var savedProgress = readStorage("wordgame_progress");
    if (savedProgress && savedProgress.date === todayKey && savedProgress.num < WORDS_PER_DAY) {
        num = savedProgress.num || 0;
        numscore = savedProgress.numscore || 0;
        hintsUsed = savedProgress.hintsUsed || 0;
        wrongGuesses = savedProgress.wrongGuesses || 0;
        hintShownForCurrent = !!savedProgress.hintShownForCurrent;

        if (hintShownForCurrent) {
            var currentWord = dailyWords[num];
            $hintDisplay.text("Hint: Starts with '" + currentWord.charAt(0) + "' (" + currentWord.length + " letters)");
        }
    } else {
        clearProgress();
    }

    // ---- Render Current Word & Progress ----
    $score.text("Daily Progress: " + numscore + " / " + WORDS_PER_DAY);
    $scrambled.text(scrambledList[num]);
    // ---- Hint Button ----
    $("#hint-btn").on("click", function () {
        if (dailyWords[num] === "nocans") return;
        var word = dailyWords[num];
        if (!hintShownForCurrent) {
            hintsUsed++;
            hintShownForCurrent = true;
            saveCurrentProgress();
        }
        $hintDisplay.text("Hint: Starts with '" + word.charAt(0) + "' (" + word.length + " letters)");
    });
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
                var finalPoints = Math.max(0, (numscore * 20) - (hintsUsed * 3) - (wrongGuesses * 2));
                var updatedHistory = saveTodayResult(finalPoints, hintsUsed, wrongGuesses);
                renderSummary(finalPoints, hintsUsed, wrongGuesses, updatedHistory);
                return;
            }
            saveCurrentProgress();
            return $("#joke-result").text("YOU GOT IT!").css("color", "#6ee7b7");
        } else {
            wrongGuesses++;
            saveCurrentProgress();
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