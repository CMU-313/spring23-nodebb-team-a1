<!-- IMPORT partials/breadcrumbs.tpl -->
<div data-widget-area="header">
    {{{each widgets.header}}}
    {{widgets.header.html}}
    {{{end}}}
</div>
<div class="recent">
    <div class="topic-list-header btn-toolbar">
        <div class="pull-left">
            <!-- IF canPost -->
            <!-- IMPORT partials/buttons/newTopic.tpl -->
            <!-- ELSE -->
            <a component="category/post/guest" href="{config.relative_path}/login" class="btn btn-primary">[[category:guest-login-post]]</a>
            <!-- ENDIF canPost -->
            <a href="{config.relative_path}/{selectedFilter.url}" class="inline-block">
                <div class="alert alert-warning hide" id="new-topics-alert"></div>
            </a>
        </div>
        <div class="btn-group pull-right">
        <!-- IMPORT partials/category/tools.tpl -->
        </div>
        
        <form class="form-inline">
            <div class="search">
                <div class="input-group">
                <input id="searchbar" onkeyup="search_topics()" type="text"
                     placeholder="Search post" class="form-control">
                <span class="input-group-addon search-button"><i class="fa fa-search"></i></span>
                <ul style="list-style: none;">
                <li component="category/topic" class="row clearfix category-item {function.generateTopicClass}" 
                <link itemprop="url" content="{config.relative_path}/topic/{../slug}" />
                </ul>
                </div>
                <script>
                    function search_topics() {
                    let input = document.getElementById('searchbar').value
                    input=input.toLowerCase();
                    let x = document.getElementsByClassName('row clearfix category-item {function.generateTopicClass}');
                    
                    for (i = 0; i < x.length; i++) { 
                        if (!x[i].innerHTML.toLowerCase().includes(input)) {
                            x[i].style.display="none";
                        }
                        else {
                            x[i].style.display="list-item";                 
                        }
                    }
                }
                </script>
                <select id="results-per-page" class="form-control">
                    <option value="50">[[admin/manage/users:50-per-page]]</option>
                    <option value="100">[[admin/manage/users:100-per-page]]</option>
                    <option v alue="250">[[admin/manage/users:250-per-page]]</option>
                    <option value="500">[[admin/manage/users:500-per-page]]</option>
                </select>  
            </div>     
        </form>
        
        
        <!-- IMPORT partials/category-filter-right.tpl -->

        <div class="btn-group pull-right bottom-sheet <!-- IF !filters.length -->hidden<!-- ENDIF !filters.length -->">
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">
                <span class="visible-sm-inline visible-md-inline visible-lg-inline">{selectedFilter.name}</span><span class="visible-xs-inline"><i class="fa fa-fw {selectedFilter.icon}"></i></span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu" role="menu">
                {{{each filters}}}
                <li role="presentation" class="category {{{if filters.selected}}}selected{{{end}}}">
                    <a role="menu-item" href="{config.relative_path}/{filters.url}"><i class="fa fa-fw <!-- IF filters.selected -->fa-check<!-- ENDIF filters.selected -->"></i>{filters.name}</a>
                </li>
                {{{end}}}
            </ul>
        </div>
    </div>

    <div class="category">
        <!-- IF !topics.length -->
        <div class="alert alert-warning" id="category-no-topics">[[recent:no_recent_topics]]</div>
        <!-- ENDIF !topics.length -->

        <!-- IMPORT partials/topics_list.tpl -->

        <!-- IF config.usePagination -->
            <!-- IMPORT partials/paginator.tpl -->
        <!-- ENDIF config.usePagination -->
    </div>
    
    
        </div>

        <hr/>

        <div class="search {search_display}">
            <i class="fa fa-spinner fa-spin hidden"></i>

            <div id="user-found-notify" class="label label-info {{{if !matchCount}}}hidden{{{end}}}">[[admin/manage/users:alerts.x-users-found, {matchCount}, {timing}]]</div>

            <div id="user-notfound-notify" class="label label-danger {{{if !query}}}hidden{{{end}}} {{{if matchCount}}}hidden{{{end}}}">[[admin/manage/users:search.not-found]]</div>
        </div>
</div>

        




        