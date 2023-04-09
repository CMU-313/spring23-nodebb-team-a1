'use strict';

const user = require('../user');
const helpers = require('./helpers');

const careerController = module.exports;

careerController.get = async function (req, res) {
    const userData = await user.getUserFields(req.uid, ['accounttype']);

    const accountType = userData.accounttype;
    let careerData = {};

    if (accountType === 'recruiter') {
        careerData.allData = await user.getAllCareerData();
    } else {
        const userCareerData = await user.getCareerData(req.uid);
        if (userCareerData) {
            careerData = userCareerData;
        } else {
            careerData.newAccount = true;
        }
    }

    careerData.accountType = accountType;
    careerData.breadcrumbs = helpers.buildBreadcrumbs([{ text: 'Career', url: '/career' }]);
    res.render('career', careerData);
};
