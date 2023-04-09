<div>
    Below is a list of all students who have signed up for this feature. Our new 
    ML-based system also provides a recommendation based on intial student application
    details. 

    Note: The ML system is currently under testing and should only be taken as a 
    recommendation, not an official decision.
</div>
<div class="career-block">
    {{{each allData}}}
        <div class="card" style="width: 28rem;">
            <div class="card-body">
                <div class="card-title">
                    {../student_id}
                </div>
                <div class="card-text">
                    Major: {../major} <br/>
                    GPA: {../gpa} <br/>
                    Extracurricular: {../extra_curricular} <br/>
                    # Prog Languages: {../num_programming_languages} <br/>
                    # Past Internships: {../num_past_internships} <br/>
                </div>
                <div class="prediction" style={function.getPredictionColor, ../prediction}>
                    {function.formatPrediction, ../prediction}
                </div>
            </div>
        </div>
    {{{end}}}    
</div>
