'use strict';

// eslint-disable-next-line import/no-unresolved
const superagent = require('superagent');
const helpers = require('../helpers');
const user = require('../../user');
const db = require('../../database');

const Career = module.exports;

Career.register = async (req, res) => {
    const userData = req.body;
    try {
        const userCareerData = {
            student_id: userData.student_id,
            major: userData.major,
            age: userData.age,
            gender: userData.gender,
            gpa: userData.gpa,
            extra_curricular: userData.extra_curricular,
            num_programming_languages: userData.num_programming_languages,
            num_past_internships: userData.num_past_internships,
        };
        let response;

        try {
            response = await superagent.post('http://localhost:5000/career_request').send(userCareerData);
        } catch (error) {
            console.log(error);
            helpers.noScriptErrors(req, res, error.message, 400);
        }

        if (response) {
            userCareerData.prediction = JSON.parse(response.text).good_employee;
        } else {
            console.log('No response received from server');
        }

        await user.setCareerData(req.uid, userCareerData);
        db.sortedSetAdd('users:career', req.uid, req.uid);
        res.json({});
    } catch (err) {
        console.log(err);
        helpers.noScriptErrors(req, res, err.message, 400);
    }
};
