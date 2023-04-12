'use strict';

define('forum/career', [
    'translator', 'jquery-form',
], function (translator) {
    const Career = {};
    let validationError = false;

    Career.init = function () {
        const student_id = $('#student_id');
        const age = $('#age');
        const gpa = $('#gpa');
        const num_programming_languages = $('#num_programming_languages');
        const num_past_internships = $('#num_past_internships');
        const signup = $('#signup');

        function validateForm(callback) {
            validationError = false;
            validateNonEmpty(student_id.val(), $('#student-id-notify'));
            validateRangedInt(age.val(), $('#age-notify'), 18, 25);
            validateRangedFloat(gpa.val(), $('#gpa-notify'), 0.0, 4.0);
            validateRangedInt(num_programming_languages.val(), $('#num-programming-languages-notify'), 1, 5);
            validateRangedInt(num_past_internships.val(), $('#num-past-internships-notify'), 0, 4);
            callback();
        }

        signup.on('click', function (e) {
            const registerBtn = $(this);
            const errorEl = $('#career-error-notify');
            errorEl.addClass('hidden');
            e.preventDefault();
            validateForm(function () {
                if (validationError) {
                    return;
                }

                registerBtn.addClass('disabled');

                registerBtn.parents('form').ajaxSubmit({
                    headers: {
                        'x-csrf-token': config.csrf_token,
                    },
                    success: function () {
                        location.reload();
                    },
                    error: function (data) {
                        translator.translate(data.responseText, config.defaultLang, function (translated) {
                            if (data.status === 403 && data.responseText === 'Forbidden') {
                                window.location.href = config.relative_path + '/career?error=csrf-invalid';
                            } else {
                                errorEl.find('p').text(translated);
                                errorEl.removeClass('hidden');
                                registerBtn.removeClass('disabled');
                            }
                        });
                    },
                });
            });
        });
    };

    function validateNonEmpty(value, value_notify) {
        if (!value || value.length === 0) {
            showError(value_notify, 'Must be non-empty');
        } else {
            showSuccess(value_notify);
        }
    }

    function validateRangedInt(value, value_notify, min_val, max_val) {
        if (!value || isNaN(value)) {
            showError(value_notify, `Must be a valid integer`);
        } else if (parseInt(value, 10) < min_val || parseInt(value, 10) > max_val) {
            showError(value_notify, `Must be within the range [${min_val}, ${max_val}]`);
        } else {
            showSuccess(value_notify);
        }
    }

    function validateRangedFloat(value, value_notify, min_val, max_val) {
        if (!value || isNaN(value)) {
            showError(value_notify, `Must be a valid floating point value`);
        } else if (parseFloat(value) < min_val || parseFloat(value) > max_val) {
            showError(value_notify, `Must be within the range [${min_val}, ${max_val}]`);
        } else {
            showSuccess(value_notify);
        }
    }

    function showError(element, msg) {
        translator.translate(msg, function (msg) {
            element.html(msg);
            element.parent()
                .removeClass('register-success')
                .addClass('register-danger');
            element.show();
        });
        validationError = true;
    }

    function showSuccess(element, msg) {
        translator.translate(msg, function (msg) {
            element.html(msg);
            element.parent()
                .removeClass('register-danger')
                .addClass('register-success');
            element.show();
        });
    }

    return Career;
});
