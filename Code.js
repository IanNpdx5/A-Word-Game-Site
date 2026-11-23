$(function () {
    var answers = {
        CA: [
            "ALGORITHM", "APPLICATION", "BINARY", "BROWSER", "CLIENT", "COMMAND", "COMPUTER", "PROGRAM", "DASHBOARD", "DESKTOP",
            "FIREWALL", "FIRMWARE", "GRAPHICS", "HARDWARE", "JAVASCRIPT", "PLATFORM", "QWERTY", "SUPERCOMPUTER", "SYNTAX",
            "TERMINAL", "nocans"
        ],
        SAS: [
            "MATGIHLRO", "INTLIPPCAAO", "RYNAIB", "WBEORSR", "CTINEL", "MDMANOC", "RTMECPOU", "GRRPAOM", "HDASDROAB", "DOSPTKE",
            "FERWIALL", "FARRMEWI", "SRGHCIPA", "AHWRRADE", "RAJVASPICT", "LAMOFPTR", "RYQWET", "RMTCEEPROUPSU", "YTAXNS",
            "TMNALERI", "THE END to play again reload the page (no correct answer)"
        ]
    };

    var num = 0;
    var numscore = 0;
    var currintq = answers.SAS[0];
    var $score = $("#score");
    var $scrambled = $("#scrambled");

    $score.text("Score: " + numscore);
    $scrambled.text(currintq);

    var check = function (answer2, Canswer2) {
        if (answer2 === Canswer2) {
            num++;
            numscore++;
            currintq = answers.SAS[num];
            $scrambled.text(currintq);
            $score.text("Score: " + numscore);

            if (answers.CA[num] === "nocans") {
                $("#answer, #btn").prop("disabled", true);
            }

            return $("#joke-result").text("YOU GOT IT!").css("color", "#6ee7b7");
        } else {
            return $("#joke-result").text("Try again!").css("color", "#fda4af");
        }
    };

    $("#joke-form").on("submit", function (event) {
        event.preventDefault();
        if (answers.CA[num] === "nocans") return;

        var $answer = $("#answer");
        var answer = $answer.val().trim().toLowerCase();
        var answersh = answers.CA[num].toLowerCase();
        check(answer, answersh);
        $answer.val("");
    });
});
