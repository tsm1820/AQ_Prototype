/* Useful variable */
var timerInterval = false;
var timestamp_stop = 0;
var last_ts_server = 0;
var total_cell = [];
var latest_cell_box_id = 0;
var cell_indices = "";
/* Event assignment to object */
$(document).ready(function()
{
    getTotalCellIndices();
    getUserInfo();
    /* Chart of user's mastery */
    /* Overview - Start quiz button */
    $("#disclaimer_btn").click(function()
    {
        $("#tab-4").click();
    });

    $("#back_overview_btn").click(function()
    {
        $("#tab-1").click();
    });

    $("#back_setting_btn").click(function()
    {
        $("#tab-3").click();
    });

    $("#tab-1").click(function() {
        $("#welcome_text").removeClass("d-none");
        $("#adt_text").addClass("d-none");

    });
    $("#tab-2").click(function() {
        $("#welcome_text").addClass("d-none");
        $("#adt_text").removeClass("d-none");
    });
    $("#tab-3").click(function() {
        $("#welcome_text").addClass("d-none");
        $("#adt_text").removeClass("d-none");
    });
    $("#tab-4").click(function() {
        $("#welcome_text").addClass("d-none");
        $("#adt_text").removeClass("d-none");
    });
    
    $("#start_quiz_btn").click(function()
    {
        startQuiz();
    });

    $("#show_upload").click(function()
    {
        if ($("#upload_photo_box").hasClass("d-none"))
        {
            $("#upload_photo_box").removeClass("d-none"); 
        }
        else
        {
            $("#upload_photo_box").addClass("d-none"); 
        }
    });

    $("#submit_photo_btn").click(function()
    {
       var endpoint = $(this).attr("href");
       upload("image_file", endpoint);
       $("#upload_photo_box").addClass("d-none");
       $("#image_file").val("");

       setTimeout(getProfilePhoto, 500);
    });

    /* Settings - Random check button */
    $("#random_check").click(function()
    {
        if ($(this).is(":checked"))
        {
            $("#random_box").removeClass("d-none");
            $("#select_box").addClass("d-none");
        }
        else
        {
            $("#select_box").removeClass("d-none");
            $("#random_box").addClass("d-none");
        }
    });

    /* Settings - Add another button*/
    $("#add_cell").click(function()
    {
        addCell();
    });

    /* Settings - save button*/
    $("#save_settings").click(function()
    {
        saveSettings();
    });

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
            alertCreation("#quiz_alert_point","danger", "Select on one of the options to submit answer.", true);
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
function getUserInfo(afterReport=false)
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
                    if (response.pretest_done == true)
                    {
                        if (response.session_active == true)
                        {
                            loading(true);
                            fetchQuestion();
                            $("#attempt_point").text("Attempt "+String(response.next_attempt));
                        }
                        else
                        {
                            if (afterReport == false)
                            {
                                // Show page
                                $("#non-session").removeClass("d-none");
                                // Overview page
                                $("#header_text").removeClass("d-none");
                                $("#welcome_text").removeClass("d-none");
                                $("#my_name").val(response.full_name);
                                $("#username_text").text(response.full_name);
                                $("#my_learner_id").val(response.user_id);
                                $("#disclaimer_text").text(response.disclaimer);
                                $("#attempt_disclaimer").text("Attempt "+String(response.next_attempt));
                                $("#attempt_point").text("Attempt "+String(response.next_attempt));
                                $("#attempt_point").addClass("d-none");

                                if (response.photo_string != "")
                                {
                                    $("#profile_img").attr("src", response.photo_string);
                                    $("#profile_img").attr("alt", "Embedded Image")
                                }
                                else
                                {
                                    $("#profile_img").attr("src", "/static/images/profile_default.png")
                                }

                                // Highlight mastery
                                $('td[useFor="mastery"]').each(function(){
                                    this_cell_data = response.mastery_list[parseInt($(this).attr("cellId")) - 1]
                                    if (this_cell_data == true)
                                    {
                                        $(this).removeClass("table-danger");
                                        $(this).removeClass("table-success");
                                        $(this).addClass("table-success");
                                    }
                                    else
                                    {
                                        $(this).removeClass("table-danger");
                                        $(this).removeClass("table-success");
                                        $(this).addClass("table-danger");
                                    }
                                });

                                presentChart("learner_ability_chart", "ability_chart_status",response.learner_ability,"", [], interpretPerformance, "", []);
                                var map_data_array = [];
                                for (i = 0 ; i < response.score_list["Data Point"].length; i++)
                                {
                                    map_data_array.push(String(response.score_list.Extrainfo[0][i]) + "/" + String(response.score_list.Extrainfo[1][i]))
                                }
                                presentChart("learner_score_chart", "ability_chart_status",response.score_list, "", [], null, "", map_data_array);

                                // Make switchable
                                $("#view_switch_btn").on('click', function() {
                                    if ($("#view_switch_title").text().toLowerCase() == "Performance history".toLowerCase())
                                    {
                                        $("#view_switch_title").text("Score History");
                                        $("#learner_score_chart").removeClass("d-none");
                                        $("#learner_ability_chart").addClass("d-none");
                                    }
                                    else
                                    {
                                        $("#view_switch_title").text("Performance History");
                                        $("#learner_ability_chart").removeClass("d-none");
                                        $("#learner_score_chart").addClass("d-none");
                                    }
                                });

                                fetchReport();
                                // Settings page
                                if (response.settings[1].length > 0)
                                {
                                    // Unrandom
                                    $("#random_check").prop("checked", false);
                                    $("#random_box").addClass("d-none");
                                    $("#select_box").removeClass("d-none");
                                    
                                    // Only for start page
                                    if (total_cell.length == 0)
                                    {
                                        for (i=0; i<response.settings[1].length; i++)
                                        {
                                            addCell(true, response.settings[1][i]);
                                        }
                                    }
                                }
                                else
                                {
                                    $("#cell_num").val(response.settings[0]);
                                }
                            }
                            else
                            {
                                $("#header_text").removeClass("d-none");
                                // Highlight mastery
                                $('td[useFor="mastery"]').each(function(){
                                    this_cell_data = response.mastery_list[parseInt($(this).attr("cellId")) - 1]
                                    if (this_cell_data == true)
                                    {
                                        $(this).removeClass("table-danger");
                                        $(this).removeClass("table-success");
                                        $(this).addClass("table-success");
                                    }
                                    else
                                    {
                                        $(this).removeClass("table-danger");
                                        $(this).removeClass("table-success");
                                        $(this).addClass("table-danger");
                                    }
                                });

                                presentChart("learner_ability_chart", "ability_chart_status",response.learner_ability,"", [], interpretPerformance, "", []);
                                var map_data_array = [];
                                for (i = 0 ; i < response.score_list["Data Point"].length; i++)
                                {
                                    map_data_array.push(String(response.score_list.Extrainfo[0][i]) + "/" + String(response.score_list.Extrainfo[1][i]))
                                }
                                presentChart("learner_score_chart", "ability_chart_status",response.score_list, "", [], null, "", map_data_array);
                            }
                        }
                    }
                    else
                    {
                        window.location.pathname = "/pretest_start";
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

function getTotalCellIndices()
{
    thisAjax();

    function thisAjax()
    {
        $.ajax({
            type: "POST",
            url: "/req_get_total_cell",
            success: function(response) 
                {
                    if (response.result == "success")
                    {
                        for (i=0; i<response.cell_list.length; i++)
                        {
                            cell_indices += "<option value=\"" + response.cell_list[i][0] + "\">Cell " + response.cell_list[i][0] + ": "+ response.cell_list[i][1] +"</option>";
                        }
                        
                    }
                }
        });
    }
}

function getProfilePhoto()
{
    thisAjax();

    function thisAjax()
    {
        $.ajax({
            type: "POST",
            url: "/req_get_profile_picture",
            success: function(response) 
                {
                    if (response.result == "success")
                    {
                        if (response.photo_string != "")
                        {
                            $("#profile_img").attr("src", response.photo_string);
                            $("#profile_img").attr("alt", "Embedded Image")
                        }
                        else
                        {
                            $("#profile_img").attr("src", "/static/images/profile_default.png")
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

function presentChart(object_id, 
                      chart_status_id, 
                      dataset, 
                      title, 
                      label_name_array=[],
                      bar_top_function=null,
                      legend_name="",
                      map_data=[])
{
    var labels = []
    var data_array = []

    // Instantiate the chart
    var is_chart_existed = Chart.getChart($("#"+object_id))

    if (is_chart_existed)
    {
        is_chart_existed.destroy();
    }

    if (dataset.hasOwnProperty("Data Point") == true)
    {
        if (dataset["Data Point"].length > 0)
        {
            // Help reduce canvas drawing time and smoother transition
            for(let i=0; i<dataset["Data Point"].length; i++)
            {
                if ((label_name_array.length > 0) && 
                    (label_name_array.length == dataset["Data Point"].length))
                {
                    labels.push(label_name_array[i])
                }
                else
                {
                    labels.push(convertEpochToFormat(dataset.Timestamp[i]))
                }
                
                data_array.push(dataset["Data Point"][i])
            }
    
            if (legend_name != "")
            {
                configure_legend_name = legend_name
                legend_enable = true;
            }
            else
            {
                configure_legend_name = "Value";
                legend_enable = false;
            }

            if (bar_top_function == null && map_data.length == 0)
            {
                padding_top_val = 0;
            }
            else
            {
                padding_top_val = 40;
            }

            // Create an array of datasets
            const datasets = [
                {
                    label: configure_legend_name,
                    data: data_array,
                    borderColor: 'rgb(251, 133, 0)',
                    backgroundColor: 'rgba(251, 133, 0, 0.9)',
                    borderWidth: 1
                },
            ];
    
            // Define the chart configuration options
            const chart_config = {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: title,
                            color: 'Black',
                            font: {
                                weight: 'bold',
                                size: 20
                            }
                        },
                        datalabels: {
                            anchor: 'end',
                            align: 'end',
                            color: 'black',
                            font: {
                                size: 15
                            },
                            rotation: -45,
                            formatter: function (value, context) {
                                if (bar_top_function != null)
                                {
                                    data = bar_top_function(value);
                                }
                                else
                                {
                                    //alert(map_data.length)
                                    if (map_data.length > 0)
                                    {
                                        data = map_data[context.dataIndex]
                                    }
                                    else
                                    {
                                        data = "";
                                    }
                                }
                                return data;
                            }
                    
                        },
                        legend: {
                            display: legend_enable
                         },
                    },
                    scales: {
                    y: {
                        beginAtZero: true
                    },
                    },
                    layout: {
                        padding:
                        {
                            top: padding_top_val
                        }
                    }
                }
            }
            $("#" + chart_status_id).html("");
            Chart.register(ChartDataLabels);
            const chart = new Chart($("#"+object_id), chart_config);
        }
        else
        {
            $("#" + chart_status_id).html("<h4 class=\"text-center\">System cannot find any data in system currently</h4>");
        }
        
    }
    else
    {
        $("#" + chart_status_id).html("<h4 class=\"text-center\">System cannot find any data in system currently</h4>");
    }
}

function interpretPerformance(ability_value)
{
    var ceiling_value = parseInt(Math.ceil(ability_value));
    if (ceiling_value <= -2)
    {
        data = "Beginner"
    }
    else if (ceiling_value == -1)
    {
        data = "Novice"
    }
    else if (ceiling_value == 0)
    {
        data = "Competent"
    }
    else if (ceiling_value == 1)
    {
        data = "Skilled"
    }
    else if (ceiling_value == 2)
    {
        data = "Proficient"
    }
    else
    {
        data = "Expert"
    }
    
    return data;
}

/* Setting section */
function addCell(selected_cell=false, cell_no=0)
{
    latest_cell_box_id += 1;
    total_cell.push(latest_cell_box_id)
    var cell_choices = cell_indices;
    var append_string;

    append_string = "<div class=\"input-group mb-3\" id=\"cell_form_" + latest_cell_box_id + "\"><span class=\"input-group-text\"><svg><use xlink:href=\"#paperclip\"/></svg></span><select id=\"select_no_"+ latest_cell_box_id +"\" selectFor=\"cell_check\" class=\"form-select\">" + cell_choices + "</select><button class=\"btn btn-danger\" onclick=\"removeCell("+ latest_cell_box_id + ")\">X</button></div>";
    
    
    $("#cell_box").append(append_string);
    
    if (selected_cell == true)
    {
        $('#select_no_'+latest_cell_box_id).prop('selectedIndex', (cell_no - 1));
    }
}

function removeCell(id)
{
    $("#cell_form_" + id).remove();
    var index = total_cell.indexOf(id);
    if (index !== -1)
    {
        total_cell.splice(index, 1);
    }
}

function saveSettings()
{
    var num_quiz = 0; 
    var num_cell = 0;
    var num_timer = 0;
    var max_limit_quiz = 0;
    var random = $("#random_check").is(":checked");
    var cell_array = [];
    
    if (random == false)
    {
        $('select[selectFor="cell_check"]').each(function(){
            cell_array.push($(this).val());
        })

        cell_array = Array.from(new Set(cell_array)); // Remove duplication
        num_cell = cell_array.length;
    }
    else
    {
        num_cell = $("#cell_num").val();
    }
    
    num_quiz = $("#quiz_num").val();
    num_timer = $("#timer_choice").val();
    max_limit_quiz = $("#max_limit").val();
    if (num_cell == 0)
    {
        if (random)
        {
            $("#cell_num").addClass("is-invalid");
            alertCreation("#main_alert_point","danger", "At least number of cell must be 1");
        }
        else
        {
            alertCreation("#main_alert_point","danger", "At least 1 cell must be selected");
        }
    }
    else
    {
        thisAjax(num_quiz, num_cell, cell_array, num_timer, max_limit_quiz);
    }
    
    function thisAjax(num_quiz, num_cell, check_quiz, num_timer, max_limit_quiz)
    {
        $.ajax({
        type: "POST",
        url: "/req_save_settings",
        data: JSON.stringify({ "num_quiz": num_quiz,
                                "check_quiz" : check_quiz,
                                "num_cell": num_cell,
                                "timer": num_timer,
                                "max_quiz": max_limit_quiz }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(response) 
            {
                if (response.result == "success")
                {
                    alertCreation("#main_alert_point","success", "Settings were saved.", true);
                }
                else
                {
                    alertCreation("#main_alert_point","danger", response.status);
                }
            }
        });
    }
}

function fetchReport(switch_page=false)
{
    thisAjax(switch_page);

    function thisAjax(switch_page)
    {
        $.ajax({
        type: "POST",
        url: "/req_fetch_report",
        success: function(response) 
            {
                if (response.result == "success")
                {    

                    if ((switch_page) || (response.n_attempt > 1))
                    {
                        seconds = response.total_second_used % 60;
                        seconds = String(seconds);

                        if (seconds < 10)
                        {
                            seconds = "0" + String(seconds);
                        }

                        minutes = String(Math.floor(response.total_second_used / 60));
                        
                        $("#report_time").val(String(minutes) + ":" + String(seconds) + " mins");
                        $("#report_correct").val(response.total_correct_ans);
                        $("#report_num_quiz").val(response.total_quiz);
                        
                        sorted = response.cell_index.sort(function(a, b) {return a-b});
                        $("#selected_cell").val(sorted.join(", "));
                        if (response.learner_ability["Data Point"].length <= 1)
                        {
                            data_label = ["Current"]
                        }
                        else
                        {
                            data_label = ["Previous", "Current"]
                        }
                        presentChart("attempt_chart", "attempt_chart_status",response.learner_ability, "", data_label, interpretPerformance, "Ability Level");
                        createAnswerHistory(response.quiz_streak, "report_attempt_answer");
                        $("#attempt_report").text("Attempt " + (response.n_attempt - 1));
                        $("#attempt_report_ans").text("Attempt " + (response.n_attempt - 1));
                        $("#attempt_disclaimer").text("Attempt "+String(response.n_attempt));
                        $("#attempt_point").text("Attempt "+String(response.n_attempt));
                        $("#text_box_tbd").text(response.textboxdata);
                        
                        if (switch_page)
                        {
                            $("#quiz_page").addClass("d-none");
                            $("#attempt_point").text("");
                            $("#attempt_point").addClass("d-none");
                            $("#abort_point").text("");
                            clearInterval(timerInterval);
                            timerInterval = false;
                            timestamp_stop = 0;
                            last_ts_server = 0;
                            updateTimer(); // Use this to simultaneously get timer.
                            $("#question_text").text("");
                            $("#question_number").text("");
                            $("#answer_text_1").text("");
                            $("#answer_text_2").text("");
                            $("#answer_text_3").text("");
                            $("#answer_text_4").text("");
                            $("#non-session").removeClass("d-none");
                            $("#tab-pane-2").removeClass("d-none");
                            $("#tab-2").removeClass("disabled");
                            $("#tab-2").click();
                            loading();
                            getUserInfo(true);
                        }
                        else
                        {
                            
                            $("#tab-pane-2").removeClass("d-none");
                            $("#tab-2").removeClass("disabled");
                        }

                        $("#query_submit_btn").on('click', submitQuery);

                        $("#retake_quiz_btn").on('click', function()
                        {
                            $("#tab-4").click();
                        });

                        $('button[useFor="reportonly"]').on('click', function(){
                            $("#history_exp_card").removeClass("d-none");
                            getExplanation($(this).attr("title"));
                        })
                    }
                    else
                    {
                        $("#tab-pane-2").addClass("d-none");
                        $("#tab-2").addClass("disabled");
                        $("#retake_quiz_btn").off('click', function()
                        {
                            $("#tab-4").click();
                        });

                        $("#query_submit_btn").off('click', submitQuery);
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

function submitQuery()
{
    var query_msg = $("#query_msg").val();
    thisAjax(query_msg);

    function thisAjax(query)
    {
        $.ajax({
        type: "POST",
        url: "/req_submit_finish_query",
        data: JSON.stringify({ "query": query}),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(response) 
            {
                if (response.result == "success")
                {
                    alertCreation("#main_alert_point","info", response.status, true);
                }
                else
                {
                    alert(response.status)
                }
            }
        });
    }
}

function getExplanation(answer_id)
{
    thisAjax(answer_id);
    function thisAjax()
    {
        $.ajax({
            type: "POST",
            url: "/req_get_explanation_history",
            data: JSON.stringify({"answer_id": answer_id }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(response) 
            {
                if (response.result == "success")
                {
                    $("#history_question_text").text(response.question_text);
                    $("#history_answer_text").text(response.answer_text);
                    $("#history_explanation_text").text(response.explanation_text);
                }
                else
                {
                    console.log(response.status);
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
            url: "/req_start_quiz",
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

/* Quiz section */
function startTimer(timestamp_start, current_ts, m_duration)
{
    timestamp_stop = timestamp_start + (m_duration * 60);
    timerInterval = setInterval(dummyTimer, 1000);
    last_ts_server = current_ts;
}

function dummyTimer()
{
    // Only set interval has this permission
    updateTimer(true);
}

function updateTimer(timeout=false)
{
    var remaining_seconds = timestamp_stop - last_ts_server;
    var seconds = 0;
    var minutes = 0;

    seconds = remaining_seconds % 60;
    seconds = String(seconds);

    if (seconds < 10)
    {
        seconds = "0" + String(seconds);
    }

    minutes = String(Math.floor(remaining_seconds / 60));

    last_ts_server += 1;

    $("#span_timer").text(minutes + ":" + seconds);

    // Stop timer as time has passed for duration.
    if (remaining_seconds <= 0)
    {
        remaining_seconds = 0;
        clearInterval(timerInterval);
        timerInterval = false;
        $("#span_timer").text("0:00");
        if (timeout == true)
        {
            fetchQuestion(true);
        }
        
    }
    else
    {
        $("#span_timer").text(minutes + ":" + seconds);
    }
}

function abortAttempt()
{
    loading(true);
    thisAjax();

    function thisAjax()
    {
        $.ajax({
            type: "POST",
            url: "/req_abort_attempt",
            success: function(response) 
                {
                    if (response.result == "success")
                    {
                        $("#quiz_page").addClass("d-none");
                        $("#attempt_point").text("");
                        $("#attempt_point").addClass("d-none");
                        $("#abort_point").text("");
                        clearInterval(timerInterval);
                        timerInterval = false;
                        timestamp_stop = 0;
                        last_ts_server = 0;
                        updateTimer(); // Use this to simultaneously get timer.
                        $("#question_text").text("");
                        $("#question_number").text("");
                        $("#answer_text_1").text("");
                        $("#answer_text_2").text("");
                        $("#answer_text_3").text("");
                        $("#answer_text_4").text("");
                        $("#non-session").removeClass("d-none");
                        $("#tab-1").click();
                        getUserInfo(true);
                        loading();
                    }
                    else
                    {
                        alert(response.status);
                    }
                }
            });
    }
}

function abortButton()
{
    var abort_btn_string = "<button class=\"btn btn-dangercustom\" id=\"abort_btn\">Abort the attempt  X</button>"
    $("#abort_point").html(abort_btn_string);

    /* Quiz - Abort button */
    $("#abort_btn").on('click', function()
    {
        var abort_check = confirm("Are you sure to abort the attempt?");

        if (abort_check == true)
        {
            abortAttempt();
        }
    });
}

function fetchQuestion(fetch_time_out=false)
{
    loading(true);
    $("#check_").prop("checked", false);
    $('input[checkbox-role="choice_selector"]').each(function(){
        $(this).prop("checked", false);
    });

    $("#non-session").addClass("d-none");
    $("#header_text").removeClass("d-none");
    $("#welcome_text").addClass("d-none");
    $("#adt_text").removeClass("d-none");
    $("#attempt_point").removeClass("d-none");
    thisAjax(fetch_time_out);
    abortButton();

    function thisAjax(fetch_time_out)
    {
        $.ajax({
            type: "POST",
            url: "/req_fetch_question",
            data: JSON.stringify({ "timeout": fetch_time_out}),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(response) 
                {
                    if (response.result == "success")
                    {
                        if (response.question == "")
                        {
                            if (response.reason == "no_quiz")
                            {
                                alertCreation("#quiz_alert_point","success", "You are already gotten all knowledges, aborting attempt.", true);
                                loading(true);
                                fetchReport(true);
                            }
                            else if (response.reason == "complete")
                            {
                                alertCreation("#quiz_alert_point","info", "Quiz completed, showing result.", true);
                                loading(true);
                                fetchReport(true);
                            }
                            else if (response.reason == "timeout")
                            {
                                alertCreation("#quiz_alert_point","info", "Timer is expired, showing result.", true);
                                loading(true);
                                fetchReport(true);
                            }
                            else
                            {
                                alertCreation("#quiz_alert_point","danger", "Error - No question data found, please contact admin", true);
                            }
                        }
                        else
                        {
                            $("#quiz_page").removeClass("d-none");
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
                            $("#show_exp_btn").addClass("disabled");
                            $("#explanation_card").addClass("fade");
                            $("#explanation_text").text("");
                            $("#submit_btn").removeClass("disabled");
                            $('#next_question').off('click', dummyBind);
                            $('#next_question').addClass("disabled");
                            createAnswerHistory(response.quiz_streak, "answer_history");
                            $("#progress_span").text(String(response.quiz_streak.length) + "/" + String(response.total_quiz))
                            
                            if (!timerInterval) // Timer interval has not been assigned
                            {
                                if (response.m_duration != 0)
                                {
                                    startTimer(response.timestart, response.current_ts,response.m_duration);
                                    updateTimer(); // Use this to simultaneously get timer.
                                }
                            }
                        }
                        loading();
                    }
                    else
                    {
                        location.reload();
                        alert(response.status);
                    }
                }
            });
    }
}

function dummyBind()
{
    fetchQuestion();
}

function submitAnswer(answer_choice)
{
    loading(true);
    thisAjax(answer_choice);

    function thisAjax(answer_choice)
    {
        $.ajax({
            type: "POST",
            url: "/req_submit_answer",
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
                        else if (response.learner_feedback == "idk")
                        {
                            $("#result_text").text("-");
                            $("#result_text").css("color", "grey");
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
                        $('#next_question').on('click',dummyBind);
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
                // append_string += "<button class=\"btn btn-secondary btn-circle text-center\" useFor=\"reportonly\" title=\"" +String(i+1) + "\">" + String(i+1) + ">?</button>" + "</div>"
                append_string += "<button class=\"btn btn-secondary btn-circle text-center\" useFor=\"reportonly\" title=\"" +String(i+1) + "\">" + "?</button>" + "</div>"
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
//         if (i < array.length)
//         {
//             if (array[i] == 1) // Success
//             {
//                 append_string += "<div class=\"col bg-success border\" useFor=\"reportonly\" style=\"color:white\">"
//                 append_string += String(i+1) + "</div>"
//             }
//             else if (array[i] == -1)
//             {
//                 append_string += "<div class=\"col bg-secondary border\" useFor=\"reportonly\" style=\"color:white\">"
//                 append_string += String(i+1) + "</div>"
//             }
//             else
//             {
//                 append_string += "<div class=\"col bg-danger border\" useFor=\"reportonly\" style=\"color:white\">"
//                 append_string += String(i+1) + "</div>"
//             }
//         }
//         else
//         {
//             append_string += "<div class=\"col\">&nbsp;</div>"
//         }

//         if (((i % 10) == 9)) // 10, 20, 30, 40, ...
//         {
//             if (row_started == true)
//             {
//                 append_string += "</div>"
//                 row_started = false;
//             }
//         }
//     }

//     $("#" + append_place).html(append_string);
// }