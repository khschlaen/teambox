(function () {

  var CommentForm = { tagName: 'form'
                    , className: 'new_comment'
                    , template: Handlebars.compile(Templates.partials.comment_form)
                    };

  CommentForm.events = {
    'click a.attach_icon'                      : 'toggleAttach'
  , 'click a.add_hours_icon'                   : 'toggleHours'
  , 'click a.add_watchers'                     : 'toggleWatchers'
  , 'focusin textarea'                         : 'revealCommentArea'
  , 'submit .new_comment:not(.convert-to-task)': 'postComment'
  , 'click span.convert_to_task a'             : 'toggleConvertToTask'
  , 'click div.convert_to_task a.cancel'       : 'toggleConvertToTask'
  };

  CommentForm.initialize = function (options) {
    _.bindAll(this, "render");
    // FIXME: bind to changes
  };

  CommentForm.render = function () {
    $(this.el).writeAttribute({
      'accept-charset': 'UTF-8'
    , 'action': this.model.url()
    , 'data-project-id': this.model.get('project_id')
    , 'data-remote': 'true'
    , 'enctype': 'multipart/form-data'
    , 'method': 'post'
    });

    $(this.el).addClassName("edit_" + this.model.get('type').toLowerCase());
    $(this.el).update(this.template(this.model.getAttributes()));

    // convert_to_task
    if (this.model.isConversation()) {
      this.convert_to_task = new Teambox.Views.ConvertToTask();
      $(this.el).select('span.convert_to_task')[0].insert({after: this.convert_to_task.render().el});
    }

    return this;
  };

  /* Cleans the form
   *
   * @param {Event} evt
   * @returns false;
   */
  CommentForm.reset = function () {
    var form = $(this.el)
      , hours = form.down('input[name*="[human_hours]"]');

    // clear comment and reset textarea height
    form.down('textarea[name*="[body]"]').setValue('').setStyle({height: ''});

    // clear populated file uploads
    form.select('input[type=file]').each(function (input) {
      if (input.getValue()) {
        input.remove();
      }
    });

    // clear hours
    if (hours) {
      hours.setValue('');
    }

    // hide initially hidden areas
    form.select('.hours_field, .upload_area').invoke('hide');

    // clear errors
    form.select('.error').invoke('remove');

    //clear google docs hidden fields and list items in the file list
    form.select('.google_docs_attachment .fields input').invoke('remove');
    form.select('.google_docs_attachment .file_list li').invoke('remove');
  };

  /* Syncs the new comment and triggers `comment:added`
   *
   * @param {Event} evt
   * @returns false;
   */
  CommentForm.postComment = function (evt) {
    var self = this
      , body = $(this.el).select('textarea')[0].value;

    evt.stop();
    (new Teambox.Models.Comment({
      parent_url: this.model.url()
    , body: body
    })).save(null, {
      success: function (model, resp) {
        self.reset();
        self.model.trigger('comment:added', resp, _.clone(Teambox.models.user));
      }
    });
    return false;
  };

  /* Toggle the attach files area
   *
   * @param {Event} evt
   * @returns false;
   */
  CommentForm.toggleAttach = function (evt) {
    $(this.el).down('.upload_area').toggle().highlight();
    return false;
  };

  /* Toggle the time tracking area
   *
   * @param {Event} evt
   * @returns false;
   */
  CommentForm.toggleHours = function (evt) {
    $(this.el).down('.hours_field').toggle().down('input').focus();
    return false;
  };

  /* Toggle the convert to task area
   *
   * @param {Event} evt
   * @returns false;
   */
  CommentForm.toggleConvertToTask = function (evt) {
    var el = $(this.el)
      , target      = el.down('span.convert_to_task a')
      , submit      = el.down('.submit', 1)
      , google_docs = el.down('.google_docs_attachment')
      , attach      = el.down('.attach');

    evt.stop();

    this.convert_to_task.toggle();

    //Avoid default comment actions for convert to task
    el.toggleClassName('not-new-comment');
    el.toggleClassName('convert-to-task');

    //Activate client-side validation for required inputs
    el.toggleClassName('required');

    // Normally, convert to task el submits to comments controller
    // Ensure we change the action accordingly
    if (el.action.endsWith('/convert_to_task')) {
      el.action = el.action.gsub(/\/convert_to_task/, '/comments');
    } else {
      el.action = el.action.gsub(/\/comments/, '');
      el.action = el.action + '/convert_to_task';
    }

    [target, submit, google_docs, attach].invoke('toggle');
  };

  /* Toggle the "Add Watchers" area
   *
   * @param {Event} evt
   * @returns false;
   */
  CommentForm.toggleWatchers = function (evt) {
    var watchers = $(this.el).down('.add_watchers_box');
    if (watchers) {
      // Remove the box if there is one already
      watchers.remove();
    } else {
      // Render it if it's not there
      watchers = new Teambox.Views.Watchers({ model: this.model });
      $(this.el).down('.actions').insert({ before: watchers.render().el });
    }
    return false;
  };

  /* Reveal the extra controls when focusing on the textarea
   *
   * @param {Event} evt
   * @returns false;
   */
  CommentForm.revealCommentArea = function (evt) {
    $(this.el).down('.extra').show();
    return false;
  };

  // exports
  Teambox.Views.CommentForm = Backbone.View.extend(CommentForm);
}());
