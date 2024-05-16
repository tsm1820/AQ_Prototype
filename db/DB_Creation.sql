--- user_info.db
CREATE TABLE user_table(
        id INTEGER PRIMARY KEY,
        username VARCHAR(16) NOT NULL UNIQUE,
        password VARCHAR(1000) NOT NULL,
        permission INTEGER DEFAULT 0
);

CREATE TABLE user_info(
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL
);

--- user_photo.db
CREATE TABLE user_photo(
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    profile_photo TEXT
);

--- adq.db
CREATE TABLE learner_ability(
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    previouse_ability REAL DEFAULT 0,
    current_ability REAL DEFAULT 0,
    n_attempt INTEGER NOT NULL,
    timestamp INTEGER NOT NULL
);

CREATE TABLE mastery_table(
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    topic_1  REAL DEFAULT 0,
    topic_2  REAL DEFAULT 0,
    topic_3  REAL DEFAULT 0,
    topic_4  REAL DEFAULT 0,
    topic_5  REAL DEFAULT 0,
    topic_6  REAL DEFAULT 0,
    topic_7  REAL DEFAULT 0,
    topic_8  REAL DEFAULT 0,
    topic_9  REAL DEFAULT 0,
    topic_10 REAL DEFAULT 0,
    topic_11 REAL DEFAULT 0,
    topic_12 REAL DEFAULT 0,
    topic_13 REAL DEFAULT 0,
    topic_14 REAL DEFAULT 0,
    topic_15 REAL DEFAULT 0,
    topic_16 REAL DEFAULT 0,
    topic_17 REAL DEFAULT 0,
    topic_18 REAL DEFAULT 0,
    topic_19 REAL DEFAULT 0,
    topic_20 REAL DEFAULT 0,
    topic_21 REAL DEFAULT 0,
    topic_22 REAL DEFAULT 0,
    topic_23 REAL DEFAULT 0,
    topic_24 REAL DEFAULT 0,
    topic_25 REAL DEFAULT 0,
    topic_26 REAL DEFAULT 0,
    topic_27 REAL DEFAULT 0,
    topic_28 REAL DEFAULT 0,
    topic_29 REAL DEFAULT 0,
    topic_30 REAL DEFAULT 0
);

CREATE TABLE train_table(
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    quiz_id INTEGER NOT NULL,
    quiz_correct_ans BOOLEAN DEFAULT 0
);

CREATE TABLE quiz_pool(
    id INTEGER PRIMARY KEY,
    cell_index INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    opt_1 TEXT NOT NULL,
    opt_2 TEXT NOT NULL,
    opt_3 TEXT NOT NULL,
    opt_4 TEXT NOT NULL,
    answer INTEGER NOT NULL,
    mod VARCHAR(10) NOT NULL,
    parent INTEGER NOT NULL,
    sub VARCHAR(10),
    id_name VARCHAR(20) NOT NULL,
    explanation TEXT
);

-- To use 0 in all response and cell index
CREATE TABLE pretest_table(
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    learner_response BOOLEAN,
    cell_index INTEGER NOT NULL
);

CREATE TABLE cell_index_description(
    id INTEGER PRIMARY KEY,
    cell_index INTEGER NOT NULL UNIQUE,
    cell_description TEXT
);

-- user_activity_log.db
CREATE TABLE activity_log(
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    n_attempt INTEGER NOT NULL,
    quiz_id INTEGER NOT NULL,
    answer_correct INTEGER NOT NULL,
    quiz_answer INTEGER NOT NULL,
    timestamp INTEGER NOT NULL
);

-- user_query.db
CREATE TABLE user_query(
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    query_detail TEXT NOT NULL,
    n_attempt INTEGER NOT NULL,
    log_timestamp INTEGER NOT NULL
);

-- textboxdata.db
CREATE TABLE textboxdata(
    id INTEGER PRIMARY KEY,
    description_data TEXT
);