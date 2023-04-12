# Career Recruiter ML Model Framework

## Overview
This folder contains an ML model for predicting whether a student applicant would be a good employee, along with some basic starter code for how to interact with the model.

This model should eventually be connected with the career page within NodeBB to allow recruiters to view a prediction of a student applicant's likeliness to be a good employee to hire.

## Setup
1. (Optional) Set up a [virtual environment](https://docs.python.org/3/library/venv.html) for Python
2. Run `pip install -r requirements.txt` to install all dependencies

## Running the Model
The file `predict.py` contains a function `predict` which, given a student application input, returns a prediction whether the student would be a good employee. 

Below is a sample run from the terminal:
```
% python3
>>> from predict import predict
>>> student = {
        "student_id": "student1",
        "major": "Computer Science",
        "age": "20",
        "gender": "M",
        "gpa": "4.0",
        "extra_curricular": "Men's Basketball",
        "num_programming_languages": "1",
        "num_past_internships": "2"
    }
>>> predict(student)
{'good_employee': 1}
```

## Function Inputs
The `predict` function takes in a student info dictionary that contains the following fields (note that all fields are taken as a `string` value and parsed by the model itself):

- `student_id`: unique identifier for the student
- `major`: major of the student
    - Computer Science, Information Systems, Business, Math, Electrical and Computer Engineering, Statistics and Machine Learning
- `age`: age of the student, [18, 25]
- `gender`: gender of the student, M(ale)/F(emale)/O(ther)
- `gpa`: gpa of the student, [0.0, 4.0]
- `extra_curricular`: the most important extracurricular activity to the student
    -  Student Theatre, Buggy, Teaching Assistant, Student Government, Society of Women Engineers, Women in CS, Volleyball, Sorority, Men's Basketball, American Football, Men's Golf, Fraternity
- `num_programming_languages`: number of programming languages that the student is familiar with, [1, 5]
- `num_past_internships`: number of previous internships that the student has had, [0, 4]

## Function Outputs
The `predict` function returns a prediction result dictionary containing the following:

- `good_employee`: numpy.int64, 1 if the student is predicted to be a good employee, 0 otherwise. 
    - **Dev Note:** If needed, this value is castable to an int via `.item()`
