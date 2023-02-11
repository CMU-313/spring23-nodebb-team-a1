<!-- IMPORT partials/breadcrumbs.tpl -->
<div data-widget-area="header">
    {{{each widgets.header}}}
    {{widgets.header.html}}
    {{{end}}}
</div>

<div class="panel-body">
    <button class="btn btn-primary" id="create" data-action="new">Create Tag</button>
</div>

<div class="modal" id="create-modal">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                <h4 class="modal-title">[[admin/manage/tags:create]]</h4>
            </div>
            <div class="modal-body">
                <form>
                    <div class="form-group">
                        <label for="create-tag-name">[[admin/manage/tags:name]]</label>
                        <input type="text" class="form-control" id="create-tag-name" placeholder="[[admin/manage/tags:name]]" />
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" id="create-modal-go">[[admin/manage/tags:create]]</button>
            </div>
        </div>
    </div>
</div>

<div class="tags">
    <!-- IF displayTagSearch -->
    <!-- IF tags.length -->
    <div class="row">
        <div class="col-lg-12">
            <div class="input-group">
                <input type="text" class="form-control" placeholder="[[global:search]]" id="tag-search">
                <span class="input-group-addon search-button"><i class="fa fa-search"></i></span>
            </div>
        </div>
    </div>
    <!-- ENDIF tags.length -->
    <!-- ENDIF displayTagSearch -->

    <!-- IF !tags.length -->
    <div class="alert alert-warning">[[tags:no_tags]]</div>
    <!-- ENDIF !tags.length -->

    <div class="category row">
        <div class="col-md-12 clearfix tag-list" data-nextstart="{nextStart}">
            <!-- IMPORT partials/tags_list.tpl -->
        </div>
    </div>
</div>
