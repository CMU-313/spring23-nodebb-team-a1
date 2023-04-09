<div>
    <!-- IF newAccount -->
        Ready to get started? Sign up below and find your next job opportunity!
    <!-- ELSE -->
        You have been successfully registered! You can update your personal information below at any time.
    <!-- END -->
</div>
<div class="career-block">
    <div class="alert alert-danger<!-- IF !error --> hidden<!-- ENDIF !error -->" id="career-error-notify" >
        <strong>Registration Error</strong>
        <p>{error}</p>
    </div>
    <form component="career/local" class="form-horizontal" role="form" action="{config.relative_path}/api/v3/career/register" method="post">
        <div class="form-group">
            <label for="student_id" class="col-lg-3 control-label">Student ID</label>
            <div class="col-lg-9">
                <input class="form-control" type="text" placeholder="Student ID" name="student_id" value="{student_id}" id="student_id" autocorrect="off" autocapitalize="off" autocomplete="off" />
                <span class="register-feedback" id="student-id-notify"></span>
            </div>
        </div>
        <div class="form-group">
            <label for="age" class="col-lg-3 control-label">Age</label>
            <div class="col-lg-9">
                <input class="form-control" type="number" placeholder="Age" name="age" value="{age}" id="age" autocorrect="off" autocapitalize="off" autocomplete="off" min="18" max="25"/>
                <span class="register-feedback" id="age-notify"></span>
            </div>
        </div>
        <div class="form-group">
            <label for="gender" class="col-lg-3 control-label">Gender</label>
            <div class="col-lg-9">
                <select class="form-control" name="gender" aria-label="Gender">
                    <option value="M"<!-- IF (gender=="M") --> selected<!-- END -->>Male</option>
                    <option value="F"<!-- IF (gender=="F") --> selected<!-- END -->>Female</option>
                    <option value="O"<!-- IF (gender=="O") --> selected<!-- END -->>Other</option>
                </select>
                <span class="register-feedback" id="gender-notify"></span>
            </div>
        </div>
        <div class="form-group">
            <label for="major" class="col-lg-3 control-label">Major</label>
            <div class="col-lg-9">
                <select class="form-control" name="major" aria-label="Major">
                    <option value="Computer Science"<!-- IF (major=="Computer Science") --> selected<!-- END -->>Computer Science</option>
                    <option value="Information Systems"<!-- IF (major=="Information Systems") --> selected<!-- END -->>Information Systems</option>
                    <option value="Business"<!-- IF (major=="Business") --> selected<!-- END -->>Business</option>
                    <option value="Math"<!-- IF (major=="Math") --> selected<!-- END -->>Math</option>
                    <option value="Electrical and Computer Engineering"<!-- IF (major=="Electrical and Computer Engineering") --> selected<!-- END -->>Electrical and Computer Engineering</option>
                    <option value="Statistics and Machine Learning"<!-- IF (major=="Statistics and Machine Learning") --> selected<!-- END -->>Statistics and Machine Learning</option>
                </select>
                <span class="register-feedback" id="major-notify"></span>
            </div>
        </div>
        <div class="form-group">
            <label for="gpa" class="col-lg-3 control-label">GPA</label>
            <div class="col-lg-9">
                <input class="form-control" type="number" placeholder="GPA" name="gpa" value="{gpa}" id="gpa" autocorrect="off" autocapitalize="off" autocomplete="off" min="0.0" max="4.0"/>
                <span class="register-feedback" id="gpa-notify"></span>
            </div>
        </div>
        <div class="form-group">
            <label for="extra_curricular" class="col-lg-3 control-label">Extracurricular Activity</label>
            <div class="col-lg-9">
                <select class="form-control" name="extra_curricular" aria-label="Extra Curricular">
                    <option value="Student Theatre"<!-- IF (extra_curricular=="Student Theatre") --> selected<!-- END -->>Student Theatre</option>
                    <option value="Buggy"<!-- IF (extra_curricular=="Buggy") --> selected<!-- END -->>Buggy</option>
                    <option value="Teaching Assistant"<!-- IF (extra_curricular=="Teaching Assistant") --> selected<!-- END -->>Teaching Assistant</option>
                    <option value="Student Government"<!-- IF (extra_curricular=="Student Government") --> selected<!-- END -->>Student Government</option>
                    <option value="Society of Women Engineers"<!-- IF (extra_curricular=="Society of Women Engineers") --> selected<!-- END -->>Society of Women Engineers</option>
                    <option value="Women in CS"<!-- IF (extra_curricular=="Women in CS") --> selected<!-- END -->>Women in CS</option>
                    <option value="Men's Basketball"<!-- IF (extra_curricular=="Men's Basketball") --> selected<!-- END -->>Men's Basketball</option>
                    <option value="Men's Golf"<!-- IF (extra_curricular=="Men's Golf") --> selected<!-- END -->>Men's Golf</option>
                    <option value="American Football"<!-- IF (extra_curricular=="American Football") --> selected<!-- END -->>American Football</option>
                    <option value="Volleyball"<!-- IF (extra_curricular=="Volleyball") --> selected<!-- END -->>Volleyball</option>
                    <option value="Sorority"<!-- IF (extra_curricular=="Sorority") --> selected<!-- END -->>Sorority</option>
                    <option value="Fraternity"<!-- IF (extra_curricular=="Fraternity") --> selected<!-- END -->>Fraternity</option>
                </select>
                <span class="register-feedback" id="extra-curricular-notify"></span>
            </div>
        </div>
        <div class="form-group">
            <label for="num_programming_languages" class="col-lg-3 control-label">Num. Known Programming Languages</label>
            <div class="col-lg-9">
                <input class="form-control" type="number" placeholder="# Programming Languages" name="num_programming_languages" value="{num_programming_languages}" id="num_programming_languages" autocorrect="off" autocapitalize="off" autocomplete="off" min="1" max="5"/>
                <span class="register-feedback" id="num-programming-languages-notify"></span>
            </div>
        </div>
        <div class="form-group">
            <label for="num_past_internships" class="col-lg-3 control-label">Num. Past Internships</label>
            <div class="col-lg-9">
                <input class="form-control" type="number" placeholder="# Past Internships" name="num_past_internships" value="{num_past_internships}" id="num_past_internships" autocorrect="off" autocapitalize="off" autocomplete="off" min="0" max="4"/>
                <span class="register-feedback" id="num-past-internships-notify"></span>
            </div>
        </div>

        <div class="form-group">
            <div class="col-lg-offset-4 col-lg-6">
                <button class="btn btn-primary btn-lg btn-block" id="signup" type="submit">
                    <!-- IF newAccount -->
                        Sign Up
                    <!-- ELSE -->
                        Update
                    <!-- END -->
                </button>
            </div>
        </div>
        <input id="token" type="hidden" name="token" value="" />
        <input id="noscript" type="hidden" name="noscript" value="true" />
        <input type="hidden" name="_csrf" value="{config.csrf_token}" />
    </form>
</div>
