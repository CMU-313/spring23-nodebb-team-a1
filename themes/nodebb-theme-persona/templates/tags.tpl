<!-- IMPORT partials/breadcrumbs.tpl -->

<script>
function startCreate() {
    document.getElementById("create-modal-new").style.display = "block";
}
function closeCreate() {
    document.getElementById("create-modal-new").style.display = "";
}
function completeCreateTag() {
    document.getElementById("create-modal-new").style.display = "none";
}
</script>
<div data-widget-area="header">
    {{{each widgets.header}}}
    {{widgets.header.html}}
    {{{end}}}
</div>

<div class="panel-body">
    <button class="btn btn-primary" id="create-tag-new" onclick="JavaScript:startCreate()">[[admin/manage/tags:create]]</button>
</div>

<div class="modal fade in" id="create-modal-new">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true" onclick="closeCreate()">&times;</button>
                <h4 class="modal-title">[[admin/manage/tags:create]]</h4>
            </div>
            <div class="modal-body">
                <form>
                    <div class="form-group">
                        <label for="create-tag-name">[[admin/manage/tags:name]]</label>
                        <input type="text" class="form-control" id="create-tag-name1" placeholder="[[admin/manage/tags:name]]" />
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" id="create-modal-go" onclick="completeCreateTag()">[[admin/manage/tags:create]]</button>
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
