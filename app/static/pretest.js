/* Event assignment to object */
$(document).ready(function()
{
    getUserInfo();

    /* Quiz - Submit button */
    $("#submit_btn").click(function()
    {
        var i = 0;
        var answer = -1;
        $('input[checkbox-role="choice_selector"]').each(function(){
            i += 1;
            if ($(this).is(":checked"))
            {
                answer = i;
            }
        });

        if (answer != -1)
        {
            var submit_check = confirm("Are you sure to submit this answer?");

            if (submit_check == true)
            {
                submitAnswer(answer);
            }
        }
        else
        {
            alertCreation("#quiz_alert_point","danger", "Select on one of the choices to submit answer.", true);
        }
        
    });

    /* Quiz - IDK button */
    $("#idk_btn").click(function()
    {
        if (confirm("Are you sure? Click 'yes' if you do not want to guess?") == true)
        {
            submitAnswer(0);
        }
        
    });
});

/* Overview and main functionality */
function getUserInfo()
{
    thisAjax();

    function thisAjax()
    {
        $.ajax({
        type: "POST",
        url: "/req_userinfo",
        success: function(response) 
            {
                if (response.result == "success")
                {
                    if (response.pretest_done == false)
                    {
                        if (response.pretest_start == true)
                        {
                            loading(true);
                            fetchQuestion();
                        }
                        else
                        {
                            startQuiz();
                        }
                    }
                    else
                    {
                        // Redirect back
                        window.location.pathname = "/";
                    }
                    
                }
                else
                {
                    alert(response.status);
                }
            }
        });
    }
}

function startQuiz()
{
    loading(true);
    thisAjax();
    
    function thisAjax()
    {
        $.ajax({
            type: "POST",
            url: "/req_start_pre_quiz",
            success: function(response) 
                {
                    if (response.result == "success")
                    {
                        fetchQuestion();
                    }
                    else
                    {
                        console.log(response.status);
                    }
                }
            });
    }
}

function fetchQuestion()
{
    loading(true);
    $("#check_").prop("checked", false);
    $('input[checkbox-role="choice_selector"]').each(function(){
        $(this).prop("checked", false);
    });

    thisAjax();

    function thisAjax()
    {
        $.ajax({
            type: "POST",
            url: "/req_fetch_pre_quiz",
            success: function(response) 
                {
                    if (response.result == "success")
                    {
                        if (response.question == "")
                        {
                            if (response.pretest_done == true)
                            {
                                alertCreation("#quiz_alert_point","success", "Pretest completed, redirect back to homepage", true);
                                window.location.pathname = "/";
                            }
                            else
                            {
                                startQuiz();
                            }
                        }
                        else
                        {
                            $("#question_text").text(response.question);
                            $("#question_number").text(response.question_no);
                            $("#answer_text_1").text(response.ans_1);
                            $("#answer_text_2").text(response.ans_2);
                            $("#answer_text_3").text(response.ans_3);
                            $("#answer_text_4").text(response.ans_4);
                            $('span[useFor="result_text"]').each(function() {
                                $(this).text("");
                                $(this).css("color", "");

                            });

                            $("#explanation_card").addClass("fade");
                            $("#explanation_text").text("");
                            $("#show_exp_btn").addClass("disabled");
                            $("#submit_btn").removeClass("disabled");
                            $('#next_question').off('click', fetchQuestion);
                            $('#next_question').addClass("disabled");
                            createAnswerHistory(response.quiz_streak, "answer_history");
                            $("#progress_span").text(String(response.quiz_streak.length) + "/" + String(response.total_quiz))
                            
                        }
                        loading();
                    }
                    else
                    {
                        alert(response.status);
                        location.reload();
                    }
                }
            });
    }
}

function submitAnswer(answer_choice)
{
    loading(true);
    thisAjax(answer_choice);

    function thisAjax(answer_choice)
    {
        $.ajax({
            type: "POST",
            url: "/req_submit_pre_quiz",
            data: JSON.stringify({"selected_choice": answer_choice }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(response) 
                {
                    loading();
                    if (response.result == "success")
                    {
                        if (response.learner_feedback == "pass")
                        {
                            $("#result_text").text("Correct");
                            $("#result_text").css("color", "green");
                        }
                        else if (response.learner_feedback == "fail")
                        {
                            $("#result_text").text("Incorrect");
                            $("#result_text").css("color", "red");
                        }
                        $('span[useFor="result_text"]').each(function(context) {

                            if ((context + 1) == answer_choice )
                            {
                                if (response.learner_feedback == "pass")
                                    {
                                        $(this).text("Correct");
                                        $(this).css("color", "green");
                                    }
                                    else if (response.learner_feedback == "fail")
                                    {
                                        $(this).text("Incorrect");
                                        $(this).css("color", "red");
                                    }
                                    else if (response.learner_feedback == "idk")
                                    {
                                        $(this).text("-");
                                        $(this).css("color", "grey");
                                    }
                            }
                        });

                        $("#explanation_card").removeClass("fade");
                        $("#explanation_text").text(response.explanation);
                        $("#submit_btn").addClass("disabled");
                        $('#next_question').removeClass("disabled");
                        $('#next_question').on('click', fetchQuestion);
                        $("#show_exp_btn").removeClass("disabled");
                        $("#show_exp_btn").addClass("collapsed");
                        $("#show_exp_btn").attr("aria-expanded", false);
                        $("#explanation_box").removeClass("show");
                    }
                    else
                    {
                        alert(response.status);
                    }
                }
            });
    }
}

function createAnswerHistory(array, append_place)
{
    row_max_length = 10;
    append_string = "";
    row_started = false;

    total_length = array.length + (row_max_length - (array.length % row_max_length)); // Total number

    for (i = 0; i < total_length; i++)
    {
       
        if ((i == 0) || ((i % 10) == 0)) // 1, 11, 21, 31, ...
        {
            if (row_started == false)
            {
                
                append_string += "<div class=\"row\">"
                row_started = true;
                
            }
        }

        if (i < array.length)
            {
                if (array[i] == 1) // Success
                {
                    append_string += "<div class=\"col text-center\" style=\"color:white\">"
                    append_string += "<button class=\"btn btn-successcustom btn-circle\" useFor=\"reportonly\" title=\"" +String(i+1) + "\">&nbsp;&nbsp;<svg fill=\"currentColor\"><use xlink:href=\"#correctcheck\"/></svg></button>" + "</div>"
                }
                else if (array[i] == -1) // IDK
                {
                    append_string += "<div class=\"col text-center\" style=\"color:white\">"
                    append_string += "<button class=\"btn btn-secondary btn-circle\" useFor=\"reportonly\" title=\"" +String(i+1) + "\">" + String(i+1) + "</button>" + "</div>"
                }
                else // Danger
                {
                    append_string += "<div class=\"col text-center\" style=\"color:white\">"
                    append_string += "<button class=\"btn btn-dangercustom btn-circle text-center\" useFor=\"reportonly\" title=\"" +String(i+1) + "\">X</button>" + "</div>"
                }
    
            }
            else
            {
                append_string += "<div class=\"col text-center\" useFor=\"reportonly\" style=\"color:white\">"
                append_string += "<button class=\"btn btn-link btn-circle disabled\"></button></div>"
                //append_string += "<div class=\"col\">&nbsp;</div>"
            }
    
            if (((i % 10) == 9)) // 10, 20, 30, 40, ...
            {
                if (row_started == true)
                {
                    append_string += "</div>"
                    row_started = false;
                }
            }
        }
    
        $("#" + append_place).html(append_string);
    }