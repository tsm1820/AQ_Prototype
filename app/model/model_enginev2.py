"""
File: app\model\model_enginev2.py

This file is a place holder of function to perform quiz interact

selected_cell
selected_quiz

both of them can either use 'kli_based_ucb_algorithm' or 'ucb_algorithm' function

"""
# Always set parent package, relative use case cause failure
import sys, os
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from interfaces.db_connector import DB_Object
from .model_mapping import GenQuizPool

import random, numpy as np, pandas as pd
from girth import twopl_mml, tag_missing_data
from sklearn.preprocessing import MinMaxScaler

# Single quiz pool to optimize calling procedure
GLOBAL_QUIZ_POOL_OBJ = GenQuizPool()
G_POOL = GLOBAL_QUIZ_POOL_OBJ.generate_quiz_pool()
G_P_POOL = GLOBAL_QUIZ_POOL_OBJ.generate_p_quiz_pool()

" Select Cell "
class AdaptiveQuiz:
    def __init__(self):
        self.learner_db = {} # Hashmap to store learner response

    def calculate_probabilities(self, ability, discrimination, difficulty):
        """Calculate probabilities of correct answers using the 2PL IRT model."""
        return 1 / (1 + np.exp(-discrimination * (ability - difficulty)))

    def calculate_information_values(self, discrimination, probabilities):
        """Calculate Information Values for each question."""
        return (discrimination ** 2) * probabilities * (1 - probabilities)

    def kli_based_ucb_algorithm (self,
                                 probabilities,
                                 available_questions,
                                 total_selections,
                                 ability,
                                 dfc,
                                 exploration_parameter=0.3):
        """
        KLI-based Upper Confidence Bound (UCB) Algorithm.

        Parameters:
        - Probability P(x) --> probabilities (numpy array): Array of probabilities for each learner to the questions
        - Observed Probability Q(x) --> normalized IRT difficulty parameter
        - available_questions (numpy array): Array of the question number values.
        - exploration_parameter C (float): Exploration parameter for UCB. Default is 1.0. 

        Return:
        - selected question (int): Index of the selected question.
        """
        # Normalize the difficulty values to [0, 1]
        min_difficulty = np.min(dfc) - 0.05 # std deviation for 5%
        max_difficulty = np.max(dfc) + 0.05 # std deviation for 5%
        normalized_difficulty = (dfc - min_difficulty) / (max_difficulty - min_difficulty) # array of Q(x)

        # Determine Kullback-Leiber Information values
        kli_values = (probabilities * np.log(probabilities / normalized_difficulty)) + ( (1-probabilities) * np.log( (1-probabilities) / (1-normalized_difficulty) ))

        N = np.sum(total_selections)

        ucb_values = kli_values + (ability - dfc) + exploration_parameter * np.sqrt(np.log(N) / (total_selections))

        # Create a dictionary to map available questions to their UCB values
        ucb_dict = dict(zip(available_questions, ucb_values))

        # Find the question with the maximum UCB value
        selected_question = max(ucb_dict, key=ucb_dict.get)

        return selected_question
    
    def ucb_algorithm(self, 
                      information_values, 
                      available_questions, 
                      total_selections, 
                      exploration_parameter=1):
        """
        Upper Confidence Bound (UCB) Algorithm.

        Parameters:
        - information_values (numpy array): Array of information values for each question.
        - available_questions (numpy array): Array of the question number values.
        - exploration_parameter C (float): Exploration parameter for UCB. Default is 1.0.

        Returns:
        - selected_question (int): Index of the selected question.
        """

        N = np.sum(total_selections)

        ucb_values = information_values + exploration_parameter * np.sqrt(np.log(N) / (total_selections))

        # Create a dictionary to map available questions to their UCB values
        ucb_dict = dict(zip(available_questions, ucb_values))

        # Find the question with the maximum UCB value
        selected_question = max(ucb_dict, key=ucb_dict.get)

        return selected_question
    
    def oneD_to_twoD(self, initial_responses):
        curr_responses = initial_responses[:,-1].reshape(-1, 1)
        return curr_responses
    
    def one_based_to_zero_based(self, one_based_indices):
        return [index - 1 for index in one_based_indices]

    def estimate_2pl_irt_parameters(self, learner_responses):
        """Estimate 2PL IRT parameters using MML."""
        estimates = twopl_mml(learner_responses)

        discrimination_params = estimates['Discrimination']
        difficulty_params = estimates['Difficulty']
        ability_params = estimates['Ability']

        return discrimination_params, difficulty_params, ability_params

    def update_response(self, initial_array, idx, integer):
        """Update learner responses by modifying the latest index."""
        copied_column = initial_array[:, -1].copy()
        copied_column[idx] = integer
        updated_array = np.column_stack((initial_array, copied_column))
        return updated_array

    def update_irt_params(self, prev, curr, idx, integer):
        """Update learner responses by modifying the latest index."""
        """copy last column --> add value to the specific index 'idx' --> update array """
        new_column = prev[:, -1].copy()
        new_column[idx] = integer
        updated_array = np.column_stack((curr, new_column))
        return updated_array

    def train_data_adaptive(self, imputed_train):
        """Calibrate IRT Params for Train data."""
        discrimination_estimates, difficulty_estimates, ability_params = self.estimate_2pl_irt_parameters(imputed_train)
        return discrimination_estimates, difficulty_estimates

    
    """ For testing and simulating the learner response 
    
        It will not be executed in the system    
    """
    def simulate_learner_response(self, probabilities, selected_question):
        " selected_question = selected cell "

        # Probability of choosing 'I don't know'
        dont_know_probability = 0.1  # Adjust the probability as needed

        # Randomly choose between 'I don't know' and a regular response
        if np.random.rand() < dont_know_probability:
            learner_response = 1e-6  # Use a special value to represent 'I don't know'
        else:
            learner_response = np.random.binomial(1, probabilities[selected_question])

        return learner_response

    def prep_data(self, user_id):
        """Execute an adaptive quiz using 2PL IRT model."""
        db_obj = DB_Object("ADQ_DB")
        
        """Cell"""
        data_list = db_obj.perform_sql("select * from mastery_table order by user_id asc", True) # id and user_id will be two first columns // Cell data from traindata.xlsx
        # transposing list
        learner_response = list(zip(*data_list))
        learner_response.pop(0) # Pop id
        learner_response.pop(0) # Pop user id

        learner_data = pd.DataFrame(learner_response)
        learner_responses = learner_data.to_numpy()

        imputed_data = np.where(learner_responses < 0.5, 0, 1) # decimal value fix
        imputed_train = imputed_data.astype(int)

        """Quiz"""
        temp = db_obj.perform_sql("select quiz_id, user_id, quiz_correct_ans as response from train_table order by user_id asc ", True) # [(user_id, quiz_id, response), ...] [(1,1,0), (1,2,1)] // train data from traindata.xlsx

        # transposing list
        learner_response = list(zip(*temp))
        # prep slot, remove duplication
        total_quiz = len(set(learner_response[0]))
        total_user = len(set(learner_response[1]))
        

        data_list = [[0] * total_user for _ in range(total_quiz)] # 157 * 531 -> 1 * 521

        for i in range(0, len(temp)):
            # Old version where some quiz are not exempted
            # data_list[temp[i][0] - 1][temp[i][1] - 1] = temp[i][2]      
            # new version 0 -> 520 = 521 nums, 521 -> 1
            data_list[(i % (total_quiz - 1))][temp[i][1] - 1] = temp[i][2]
        
        quiz_responses = (pd.DataFrame(data_list).to_numpy())
        tagged_quiz_responses = tag_missing_data(quiz_responses, [0, 1])

        # 'cell_mastery' contains knowledge result to each cell
        
        data_list = db_obj.perform_sql("select learner_response, cell_index from pretest_table where user_id = " + str(user_id), True) # id and user_id will be two first columns // testdata.xlsx
        df = pd.DataFrame(data_list, columns=['learner_response', 'cell_index'])

        # Group by cell_index and calculate the average learner_response for each cell
        cell_avg = df.groupby('cell_index')['learner_response'].mean()

        # Use MinMaxScaler to normalize the values between 0 and 1
        scaler = MinMaxScaler()
        normalized_values = scaler.fit_transform(cell_avg.values.reshape(-1, 1))

        # Apply threshold (greater than 0.5 becomes 1, otherwise 0)
        learner_mastery_cell = (normalized_values > 0.5).astype(int)

        # Convert dichotomous values to 2D array
        cell_mastery = learner_mastery_cell.reshape(-1, 1)

        total_selections_cell = np.ones(len(cell_mastery))
        total_selections_quiz = np.ones(len(tagged_quiz_responses))

        # Initial response value for every question = 0
        rps = np.zeros(len(tagged_quiz_responses)).astype(int).reshape(-1, 1)

        return imputed_train, tagged_quiz_responses, cell_mastery, total_selections_cell, total_selections_quiz, rps
    
    def activate_quiz(self, user_id, previous_learner_ability):
        """ One time activation for starting the quiz session """
        imputed_train, tagged_quiz_responses, initial_cell, total_selections_cell, total_selections_quiz, rps = self.prep_data(user_id)

        dsc_cell, dfc_cell = self.train_data_adaptive(imputed_train)
        dsc, dfc, ability_params = self.estimate_2pl_irt_parameters(initial_cell) # Note that it estimates only ability parameters
        num_cells = len(initial_cell)  # num_cell = 30
        cell_array = np.arange(1, num_cells + 1) # from cell 1 to cell 30
        if (previous_learner_ability == None):
            learner_ability_cell = ability_params[-1]  # Learner ability for cell, the last item of the list
        else:
            learner_ability_cell = previous_learner_ability
 
        last_column_all_ones = np.all(initial_cell[:, -1] == 1)
        if (last_column_all_ones):
            no_quiz = True
        else:
            no_quiz = False
        return dsc_cell, dfc_cell, tagged_quiz_responses, initial_cell, total_selections_cell, total_selections_quiz, rps, cell_array, learner_ability_cell, no_quiz, imputed_train

    def fetch_quiz_mastery(self,
                   input_dsc_cell,
                   input_dfc_cell,
                   input_learner_ability_cell,
                   input_cell_array,
                   input_total_selections_cell,
                   input_tagged_quiz_response,
                   input_cell_var,
                   input_user_cell=None):
        
        # Maintain I/O
        dsc_cell = input_dsc_cell
        dfc_cell = input_dfc_cell
        cell_array = input_cell_array
        total_selections_cell = input_total_selections_cell
        user_cell = input_user_cell
        cell_var = input_cell_var

        """ Questions from overall collection selection """
        
        if (user_cell != None) and (type(user_cell) == type([])):
            selected_cell = random.choice(user_cell)
            user_cell.remove(selected_cell)
        else:
            probabilities = self.calculate_probabilities(input_learner_ability_cell, dsc_cell, dfc_cell)
            information_values = self.calculate_information_values(dsc_cell, probabilities)
            # selected_cell = self.ucb_algorithm(information_values, cell_array, total_selections_cell)
            selected_cell = self.kli_based_ucb_algorithm(probabilities, cell_array, total_selections_cell, input_learner_ability_cell, dfc_cell)

        
        
        # Incase that selected cell cannot be found in question pool
        while selected_cell not in G_POOL.keys():
            cell_array = np.setdiff1d(cell_array, [selected_cell])

            dsc_cell = np.delete(dsc_cell, selected_cell - 1)
            dfc_cell = np.delete(dfc_cell, selected_cell - 1)

            probabilities = self.calculate_probabilities(input_learner_ability_cell, dsc_cell, dfc_cell)
            information_values = self.calculate_information_values(dsc_cell, probabilities)

            total_selections_cell = np.delete(total_selections_cell, selected_cell - 1)
            # selected_cell = self.ucb_algorithm(information_values, cell_array, total_selections_cell) # To add into memory
            selected_cell = self.kli_based_ucb_algorithm(probabilities, cell_array, total_selections_cell, input_learner_ability_cell, dfc_cell)
        
        available_questions = G_POOL.get(selected_cell, [])
        tagged_quiz_response2 = tag_missing_data(input_tagged_quiz_response[self.one_based_to_zero_based(available_questions)], [0, 1])
        dsc_quiz, dfc_quiz = self.train_data_adaptive(tagged_quiz_response2)

        cell_var[selected_cell-1] += 1
        count = 0

        return dsc_cell, dfc_cell, cell_array, total_selections_cell, user_cell, available_questions, cell_var, selected_cell, dsc_quiz, dfc_quiz, count
    
    def fetch_sub_quiz(self,
                       input_dsc_quiz,
                       input_dfc_quiz,
                       input_total_selections_quiz,
                       input_learner_ability_cell,
                       input_available_questions,
                       input_cell_available_question):
        
        total_selections_quiz = input_total_selections_quiz

        # Question list must be more than 3
        probabilities_quiz = self.calculate_probabilities(input_learner_ability_cell, input_dsc_quiz, input_dfc_quiz)
        information_values_quiz = self.calculate_information_values(input_dsc_quiz, probabilities_quiz)

        if (len(input_cell_available_question) >= 3):
            # selected_question = self.ucb_algorithm(information_values_quiz, np.array(input_available_questions),
                                                    # input_total_selections_quiz[self.one_based_to_zero_based(input_available_questions)])
            selected_question = self.kli_based_ucb_algorithm(probabilities_quiz, np.array(input_available_questions), 
                                                             input_total_selections_quiz[self.one_based_to_zero_based(input_available_questions)], input_learner_ability_cell, input_dfc_quiz)
            question_data = GLOBAL_QUIZ_POOL_OBJ.get_question_data(selected_question)
            simulate_learner_response = None
        else:
            # selected_question = self.ucb_algorithm(information_values_quiz, np.array(input_available_questions),
                                                    # input_total_selections_quiz)
            selected_question = self.kli_based_ucb_algorithm(probabilities_quiz, np.array(input_available_questions), 
                                                             input_total_selections_quiz[self.one_based_to_zero_based(input_available_questions)], input_learner_ability_cell, input_dfc_quiz)
            
            total_selections_quiz[selected_question - 1] += 1
            
            question_data = None
            simulate_learner_response = self.simulate_learner_response(probabilities_quiz, selected_question)
            
        return question_data, total_selections_quiz, selected_question, simulate_learner_response


    def record_submitted_answer(self,
                      input_selected_question,
                      input_learner_response, # 1 or 0
                      input_rps,
                      input_available_questions,
                      input_tagged_response,
                      input_count,
                      input_num_quizzes,
                      input_dsc_quiz,
                      input_dfc_quiz,
                      input_cell_available_question):
        # Maintain I/O
        count = input_count
        dsc_quiz = input_dsc_quiz
        dfc_quiz = input_dfc_quiz

        rps = self.update_response(input_rps, input_selected_question-1, input_learner_response)
        tagged_response = self.update_irt_params(rps, input_tagged_response, input_selected_question-1, input_learner_response)

        available_questions = np.setdiff1d(input_available_questions, [input_selected_question])

        if (len(input_cell_available_question) >= 3):
            if (input_learner_response == 1):
                count += 1

            if (available_questions.size > 0):
                tagged_quiz_responses2 = tag_missing_data(input_tagged_response[self.one_based_to_zero_based(available_questions)], [0, 1])
                dsc_quiz, dfc_quiz = self.train_data_adaptive(tagged_quiz_responses2)

            if count >= 0.7 * input_num_quizzes:
                trigger = 1 # No further testing needed
            else:
                trigger = 0

        else:
            if (input_learner_response == 1):
                trigger = 1
            else:
                trigger = 0

        return rps, tagged_response, available_questions, count, trigger, dsc_quiz, dfc_quiz
    
    def update_profile(self,
                       input_initial_cell,
                       input_selected_cell,
                       input_imputed_train,
                       input_trigger,
                       input_cell_var,
                       input_cell_array,
                       input_i,
                       input_append_cell):
        
        initial_cell = self.update_response(input_initial_cell, input_selected_cell-1, input_trigger) # trigger
        all_data_cell = self.update_irt_params(initial_cell, input_imputed_train, input_selected_cell-1, input_trigger)

        # Update Ability Estimation for Learner
        estimates_learner = twopl_mml(initial_cell)
        ability_params = estimates_learner['Ability']
        learner_ability_cell = ability_params[input_i + 1]

        # Update IRT for Overall Cell
        estimates_overall = twopl_mml(all_data_cell)
        dsc_cell = estimates_overall['Discrimination']
        dfc_cell = estimates_overall['Difficulty']

         # Avoid Repeating the same cell
        cell_array = np.setdiff1d(input_cell_array, [input_selected_cell])
        # for idx in selected_cells:
        #     dsc_cell = np.delete(dsc_cell, idx - 1)
        #     dfc_cell = np.delete(dfc_cell, idx - 1)
        to_delete = [idx - 1 for idx in input_append_cell]
        dsc_cell = np.delete(dsc_cell, to_delete)
        dfc_cell = np.delete(dfc_cell, to_delete)

        total_selections_cell = np.delete(input_cell_var, to_delete)

        last_column_all_ones = np.all(initial_cell[:, -1] == 1)
        if last_column_all_ones:
            no_quiz = True
        else:
            no_quiz = False

        return dsc_cell, dfc_cell, learner_ability_cell, total_selections_cell, cell_array, no_quiz, initial_cell
    
    def finalize_mastery(self, 
                         input_initial_cell, 
                         input_first_learn_ab_cell):
        
        mastery_finalize_cell = input_initial_cell[:, -1].copy()
        mastery_finalize_cell = mastery_finalize_cell.tolist()
        estimates_learner = twopl_mml(input_initial_cell)
        ability_params = estimates_learner['Ability']
        learner_ability_cell = ability_params[-1]
        if (learner_ability_cell < input_first_learn_ab_cell):
            learner_ability_cell = input_first_learn_ab_cell

        return mastery_finalize_cell, learner_ability_cell

if __name__ == "__main__":
    pass