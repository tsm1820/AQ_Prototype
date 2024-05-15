"""
File: app\model\model_dbquery.py

This file is a place holder of function to perform general inqueries that is not related to confidential/credential data
"""
# Always set parent package, relative use case cause failure
import sys, os
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

import random as rd
from interfaces.db_connector import DB_Object
from globalclass.osbasic import Fundamental as OSBASIC


class GeneralDataQuery():
    @staticmethod
    def get_cell_indices():
        db_obj = DB_Object("ADQ_DB")
        sql_command = "select cell_index, cell_description from cell_index_description"
        result = db_obj.perform_sql(sql_command, True)
        return result
    
    @staticmethod
    def get_disclaimer():
        disclaimer_file_path = OSBASIC.loadConfiguration("/conf/db_conf.json")
        disclaimer_string = ""
        with open(disclaimer_file_path['DISCLAIMER_TEXT'], "r") as fp:
            disclaimer_string = fp.read()

        return disclaimer_string

class UserDataQuery():
    @staticmethod
    def submit_user_query(user_id, n_attempt, query_detail, timestamp):
        db_obj = DB_Object("USER_QUERY_DB")
        sql_command = "insert into user_query(user_id, n_attempt, query_detail, log_timestamp) values("
        sql_command += str(user_id) + "," + str(n_attempt) + ",\"" + query_detail + "\","  + str(timestamp) + ")"

        db_obj.perform_sql(sql_command)
        db_obj.commit_update()

    @staticmethod
    def get_report_data(user_id):
        db_obj = DB_Object("USER_ACTIVITY_LOG_DB")
        sql_command = "select quiz_id, answer_correct, quiz_answer, timestamp from activity_log where n_attempt=(select MAX(n_attempt) from activity_log where user_id="+str(user_id)
        sql_command += ") and user_id=" + str(user_id)

        get_info = db_obj.perform_sql(sql_command, True)
        item = list(zip(*get_info))

        selected_quiz = item[0]
        response_list = item[1]
        choice_list = item[2]
        timestamp = item[3]
        
        return [selected_quiz, response_list, choice_list, timestamp]

    @staticmethod
    def log_user_activity(user_id, n_attempt, quiz_id, quiz_answer, correctness, timestamp):
        db_obj = DB_Object("USER_ACTIVITY_LOG_DB")
        sql_command = "insert into activity_log(user_id, n_attempt, quiz_id, answer_correct ,quiz_answer, timestamp) values("
        sql_command += str(user_id) + "," + str(n_attempt) + "," + str(quiz_id) + "," + str(correctness) +"," + str(quiz_answer) + "," +str(timestamp) + ")"

        db_obj.perform_sql(sql_command)
        db_obj.commit_update()


    @staticmethod
    def update_user_attempt(user_id, prev_ability_cell, current_ability_cell, mastery_list):
        db_obj = DB_Object("ADQ_DB")
        # Mastery updating
        sql_command = "update mastery_table set topic_"
        for i in range(0, len(mastery_list)):
            if (mastery_list[i] == 1):
                string_value = str(i + 1) + " ="  + str(mastery_list[i]) + " where user_id=" + str(user_id)
                db_obj.perform_sql(sql_command + string_value)

        get_info = db_obj.perform_sql("select distinct n_attempt from learner_ability where user_id=" + str(user_id), True)
        if (get_info != []):
            get_info = max(get_info)
            last_attempt = get_info[0]
        else:
            last_attempt = 0
        
        # Ability updating
        sql_command = "insert into learner_ability (user_id, previouse_ability, current_ability, n_attempt, timestamp) values("
        sql_command += str(user_id) + "," + str(prev_ability_cell) + "," + str(current_ability_cell) + "," + str(last_attempt + 1) + "," + str(int(OSBASIC.getCurrentTimestamp())) + ")"

        db_obj.perform_sql(sql_command)
        db_obj.commit_update()
    
    @staticmethod
    def create_mastery_slot(user_id):
        db_obj = DB_Object("ADQ_DB")
        sql_command = "insert into mastery_table (user_id) values (" + str(user_id) + ")"
        db_obj.perform_sql(sql_command)
        db_obj.commit_update()

    @staticmethod
    def create_train_slot(user_id):
        db_obj = DB_Object("ADQ_DB")
        get_info = db_obj.perform_sql("select id from quiz_pool where pretest_quiz = 0", True)
        user_possibility = db_obj.perform_sql("select CAST(SUM(learner_response) AS FLOAT) / "+
                                              "CAST(COUNT(id) as FLOAT) from pretest_table " +
                                              "where (cell_index=4 OR cell_index=7 OR cell_index=9 OR cell_index=11)" +
                                             " AND user_id=" + str(user_id),True)
        
        user_possibility = user_possibility[0][0]

        sql_command = "insert into train_table (user_id, quiz_id, quiz_correct_ans) values("
        for i in range(0, len(get_info)):
            quiz_id = get_info[i][0]
            string_value = str(user_id ) + ", " + str(quiz_id) + "," + str(1 if rd.random() < user_possibility else 0) + ")"
            db_obj.perform_sql(sql_command + string_value)
        
        db_obj.commit_update()

    @staticmethod
    def submit_user_pretest(user_id, res_list, cell_list):
        db_obj = DB_Object("ADQ_DB")
        sql_command = "insert into pretest_table(user_id, cell_index,learner_response) values("
        for i in range(0, len(res_list)):
            string_value = str(user_id) + "," + str(cell_list[i]) + "," + str(res_list[i]) + ")"
            db_obj.perform_sql(sql_command + string_value)

        # padding to have all cells, otherwise it will be troubled due to pre-made with 30 cells assumption
        for i in range(1, (30 + 1)):
            if (i not in cell_list):
                string_value = str(user_id) + "," + str(i) + ",0)"
                db_obj.perform_sql(sql_command + string_value)

        db_obj.commit_update()

    @staticmethod
    def get_user_pretest(user_id):
        db_obj = DB_Object("ADQ_DB")
        sql_command = "select learner_response, cell_index from pretest_table where user_id="+str(user_id)
        result = db_obj.perform_sql(sql_command, True)
        if (result != []):
            ret_val = True
        else:
            ret_val = False
        
        return ret_val

    @staticmethod
    def get_latest_attempt(user_id):
        db_obj = DB_Object("ADQ_DB")
        get_info = db_obj.perform_sql("select distinct n_attempt from learner_ability where user_id=" + str(user_id), True)
        if (get_info != []):
            get_info = max(get_info)
            last_attempt = get_info[0]
        else:
            last_attempt = 0

        return last_attempt
    
    @staticmethod
    def get_previous_ability(user_id):
        db_obj = DB_Object("ADQ_DB")
        sql_command = "select current_ability from learner_ability where n_attempt=(select MAX(n_attempt) from learner_ability where user_id=" + str(user_id)
        sql_command += ") and user_id=" + str(user_id)
        get_info = db_obj.perform_sql(sql_command, True)
        if (get_info != []):
            previous_ability = get_info[0][0]
        else:
            previous_ability = None
        
        return previous_ability
    
    @staticmethod
    def get_user_photo(user_id):
        db_obj = DB_Object("USERPHOTO_DB")

        get_info = db_obj.perform_sql("select profile_photo from user_photo where user_id=" + str(user_id), True)
        if (len(get_info) == 0):
            ret_val = ""
        else:
            ret_val = get_info[0][0]
            ret_val = "data:image/png;base64,"+ret_val
            
        return ret_val

    @staticmethod
    def insert_user_photo(base64_string, user_id):
        file_path = OSBASIC.convertB64ToFile(base64_string)
        file_path = OSBASIC.convertPictoSmallerFile(file_path=file_path, size=250) # Standardize 250 pixels (with ratio of original file)
        mod_image_string = OSBASIC.convertImageToBase64(file_path,True) # Convert and give base 64 only

        db_obj = DB_Object("USERPHOTO_DB")
        sql_command = "select user_id from user_photo where user_id=" + str(user_id)
        get_info = db_obj.perform_sql(sql_command, True)
        

        if (len(get_info) == 0): # No image has been uploaded before
            sql_command = "insert into user_photo(user_id, profile_photo) values(" + str(user_id) + ", \"" + mod_image_string + "\")"
            db_obj.perform_sql(sql_command)
            db_obj.commit_update()
        else: # Image already has been uploaded, needs update
            sql_command = "update user_photo set profile_photo=\"" + mod_image_string + "\" where user_id=" + str(user_id)
            db_obj.perform_sql(sql_command)
            db_obj.commit_update()

        # Check image is correct
        get_info = db_obj.perform_sql("select profile_photo from user_photo where user_id=" + str(user_id), True)
        if (get_info[0][0] == mod_image_string):
            ret_val = True
        else:
            ret_val = False

        return ret_val
    
    @staticmethod
    def get_user_abilities(user_id):
        db_obj = DB_Object("ADQ_DB")
        sql_command = "select timestamp, current_ability from learner_ability where user_id=" + str(user_id) + " order by n_attempt asc"
        get_info = db_obj.perform_sql(sql_command, True)
        user_ab_list = []
        user_timestamp = []

        for i in range(0, len(get_info)):
            user_timestamp.append(get_info[i][0])
            user_ab_list.append(get_info[i][1])
            
        
        return user_ab_list, user_timestamp
    
    @staticmethod
    def get_user_mastery(user_id):
        db_obj = DB_Object("ADQ_DB")
        sql_command = "select * from mastery_table where user_id=" + str(user_id)
        get_info = db_obj.perform_sql(sql_command, True)

        item = list(zip(*get_info))
        item.pop(0) # Pop id
        item.pop(0) # Pop user id
        mastery_list = []
        for i in range(0, len(item)):
            mastery_list.append(True if item[i][0] >= 1.0 else False)
            
        return mastery_list

if __name__ == "__main__":
    print(UserDataQuery.get_report_data(1))
    pass