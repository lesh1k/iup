; 'use strict';

(function() {
    if (this.iup) {
        console.error('JS-iup: window has "iup" property defined');
    }

    var _all_instances = {};
    this.iup = function init(container_selector, options) {
        if (!container_selector || typeof container_selector !== 'string') {
            throw 'Can\'t find target element using: $("' + container_selector + '")';
        }

        if (_all_instances[container_selector]) {
            if (typeof arguments[1] === 'string' && arguments[1] === 'destroy') {
                iupDestroyInstance.call(this, _all_instances[container_selector]);
                return;
            }
            return _all_instances[container_selector];
        }

        this.instance = iupMakeConfig(container_selector, options);
        _all_instances[container_selector] = this.instance;
        this.instance.render();
        return this.instance;
    };

    function iupMakeConfig(container_selector, options) {
        var defaults = iupGetDefaults(),
            data_attrs = retrieveConfigFromDataAttributes(container_selector);
        defaults.selectors.container = container_selector;

        $.extend(true, defaults, data_attrs);

        // Create options by extending defaults with the passed in arugments
        if (options && typeof options === 'object') {
            $.extend(true, defaults, options);
        }

        // Define selectors
        for (var prop in defaults.classes) {
            var class_selector = '.' + defaults.classes[prop].split(' ').join('.');
            defaults.selectors[prop] = defaults.selectors.container + ' ' + class_selector;
        }

        // Pre-populate items
        defaults.max_items = defaults.rows * defaults.columns;
        var to_add_count = defaults.max_items - defaults.items.length;
        for (var i=0; i < to_add_count; i++) {
            defaults.items.push({});
        }

        return defaults;
    }

    function iupGetDefaults() {
        var defaults = {
            // Options
            actions: {
                remove: {
                    config: {
                        contentType: false,
                        data: new FormData(),
                        dataType: 'json',
                        processData: false,
                        type: 'POST',
                        url: window.location.pathname
                    },
                    handlers: {
                        always: iupRemoveItemAlwaysHandler,
                        // when calling "done": this is set to instance, first param index of item to remove, second the response
                        done: iupRemoveItemDoneHandler,
                        fail: iupRemoveItemFailHandler
                    }
                },
                upload: {
                    config: {
                        contentType: false,
                        data: new FormData(),
                        dataType: 'json',
                        processData: false,
                        type: 'POST',
                        url: window.location.pathname,
                        xhr: iupAjaxUploadCustomXhr
                    },
                    handlers: {
                        always: iupAjaxUploadAlwaysHandler,
                        // when calling "done": this is set to instance, first param - config received on upload start
                        done: iupAjaxUploadDoneHandler,
                        fail: iupAjaxUploadFailHandler
                    }
                }
            },
            classes: {
                wrapper: 'js-iup-wrapper',
                thumbs_container: 'js-iup-thumbs-container',
                thumb: 'js-iup-thumb',
                preview_container: 'js-iup-preview',
                input_container: 'js-iup-files-field-container',
                upload_field: 'js-iup-files-field'
            },
            columns: 5,
            items: [], // Sample item: {id: "SOME_STRING", src: "path/to/thumb/img", preview_src: "path/to/img/preview"}
            preview_enable: true,
            rows: 2,
            selectors: {},
            // Methods
            addItem: iupAddItem,
            removeItem: iupRemoveItem,
            removeItemLocally: iupRemoveItemLocally,
            render: iupRenderInstance,
            renderFileInput: iupRenderFileInput,
            renderImagePreview: iupRenderImagePreview,
            renderOneThumbnail: iupRenderOneThumbnail,
            renderThumbnails: iupRenderThumbnails,
            setupActions: iupSetupActions
            // destroy: iupDestroyInstance
        };

        return defaults;
    }

    function retrieveConfigFromDataAttributes(container_selector) {
        var data = $(container_selector).data(),
            parsed = {};

        for (var k in data) {
            var option = dataAttrToObject(k, data[k], '.');
            $.extend(true, parsed, option);
        }

        return parsed;
    }

    function iupRenderInstance() {
        console.log('iupRenderInstance for:', this);
        $(this.selectors.container).append($('<div />', {class: this.classes.wrapper}));
        if (this.preview_enable) {
            this.renderImagePreview();
        }
        this.renderFileInput();
        this.renderThumbnails();
        this.setupActions();
    }

    function iupRenderImagePreview() {
        console.log('iupRenderImagePreview for:', this);
        var $container = $('<div />', {class: this.classes.preview_container});
        $(this.selectors.wrapper).append($container);
        $container.append($('<img />'));
    }

    function iupRenderFileInput() {
        console.log('iupRenderFileInput for:', this);
        var $container = $('<div />', {class: this.classes.input_container}),
            $form = $('<form />'),
            $input = $('<input/>', {class: this.classes.upload_field, type: 'file', multiple:''});
        $form.append($input);
        $container.append($form);
        $(this.selectors.wrapper).append($container);
    }

    function iupRenderThumbnails() {
        console.log('iupRenderThumbnails for:', this);
        var $container = $('<div />', {class: this.classes.thumbs_container});
        $(this.selectors.wrapper).append($container);
        this.items.forEach(this.renderOneThumbnail.bind(this));
    }

    function iupRenderOneThumbnail(thumbnail) {
        console.log('iupRenderOneThumbnail for:', this);

        var index = this.items.indexOf(thumbnail),
            classes = this.classes.thumb;

        if (thumbnail.src) {
            classes += ' js-iup-thumb--ready';
        } else {
            classes += ' js-iup-thumb--empty';
        }

        if (!thumbnail.src && !$(this.selectors.wrapper).find('.js-iup-thumb--add-link').length) {
            classes += ' js-iup-thumb--add-link';
        }

        var id = thumbnail.id || (this.selectors.container + '-thumbnail-' + String(index)),
            html = '';

        html += '<div id="' + id.replace('#', '') + '" class="' + classes + '" data-image-id="' + (thumbnail.id || '') + '">';
        html +=   '<button class="js-iup-thumb__remove js-iup-thumb__remove--button" type="button">&times;</button>';
        html +=   '<img src="' + (thumbnail.src || '') + '" alt="" data-preview-src="' + (thumbnail.preview_src || '') + '"/>';
        html +=   '<a href="#" class="js-iup-thumb__add">';
        html +=       '<span>+</span>';
        html +=       '<br>';
        html +=       'Add photo';
        html +=   '</a>';
        html +=   '<div class="js-iup-thumb__filename"></div>';
        html +=   '<div class="js-iup-thumb__message"></div>';
        html +=   '<div>';
        html +=       '<a href="#" class="js-iup-thumb__retry js-iup-thumb__retry--link">Retry</a>';
        html +=       '<a href="#" class="js-iup-thumb__remove-locally js-iup-thumb__remove--link">Remove</a>';
        html +=   '</div>';
        html +=   '<progress value="0" max="100"></progress>';
        html +=   '<a href="#" class="js-iup-thumb__cancel-upload">Cancel</a>';
        html += '</div>';

        $(this.selectors.thumbs_container).append(html);
    }

    function iupAddItem(item) {
        console.log('iupAddItem for:', this);
        this.items.push(item);
        this.renderOneThumbnail(item);
    }

    function iupRemoveItem(index) {
        console.log('iupRemoveItem for:', this);
        var config = $.extend(true, {}, this.actions.remove.config),
            instance = this;

        config.data = new FormData();
        config.data.append('image_id', instance.items[index].id);
        $.ajax(config)
        .done(this.actions.remove.handlers.done.bind(this, index))
        .fail(this.actions.remove.handlers.fail)
        .always(this.actions.remove.handlers.always);
    }

    function iupRemoveItemDoneHandler(index, response) {
        console.log('done');
        if (!response.err_message) {
            $(this.selectors.wrapper).find('[data-image-id=' + this.items[index].id + ']').remove();
            this.items.splice(index, 1);
            this.addItem({});
        } else {
            console.warn(response.message);
        }
    }

    function iupRemoveItemFailHandler() {
        console.log('error');
    }

    function iupRemoveItemAlwaysHandler() {
        console.log('done');
    }

    function iupRemoveItemLocally(index) {
        this.items.splice(index, 1);
        $(this.selectors.thumb).eq(index).remove();
        this.addItem({});
    }

    function iupDestroyInstance(instance) {
        console.log('iupDestroyInstance for:', this);
        var $container = $(instance.selectors.container);
        delete _all_instances[instance.selectors.container];
        $container.empty();
    }

    function iupSetupActions() {
        iupSetupAddItem.call(this);
        iupSetupRemoveItem.call(this);
        iupSetupFileUploadHandler.call(this);

        if (this.preview_enable) {
            iupSetupPreview.call(this);
        }
    }

    function iupSetupAddItem() {
        var add_item_selector = this.selectors.wrapper + ' .js-iup-thumb__add';

        $(document).off('click', add_item_selector).on('click', add_item_selector, function(e) {
            e.preventDefault();
            $(this.selectors.wrapper).find('.js-iup-files-field').click();
        }.bind(this));
    }

    function iupSetupRemoveItem() {
        var remove_item_selector = this.selectors.wrapper + ' .js-iup-thumb__remove',
            self = this;

        $(document).off('click', remove_item_selector).on('click', remove_item_selector, function(e) {
            e.preventDefault();
            var $btn = $(this),
                $thumb = $btn.parents('.js-iup-thumb'),
                index = $(self.selectors.thumbs_container).find('.' + self.classes.thumb).index($thumb);
            self.removeItem(index);
        });
    }

    function iupSetupFileUploadHandler() {
        var $multifileinput = $(this.selectors.upload_field);

        $multifileinput.change(function(e) {
            var empty_thumbs = $(this.selectors.thumbs_container).find('.js-iup-thumb--empty');

            if (!empty_thumbs) {
                console.log('Maximum number of images added.');
                return;
            }

            for (var i=0; i < e.target.files.length && i < empty_thumbs.length; i++) {
                var options = {
                    ajax: {
                        data: new FormData()
                    },
                    thumb_selector: empty_thumbs[i]
                };

                $(empty_thumbs[i]).removeClass('js-iup-thumb--add-link js-iup-thumb--empty')
                                  .addClass('js-iup-thumb--uploading')
                                  .css('background-image', 'none')
                                  .find('.js-iup-thumb__filename').html(e.target.files[i].name);

                options.ajax.data.append('file', e.target.files[i]);
                iupAjaxUpload.call(this, options);
            }

            $(this.selectors.thumbs_container).find('.js-iup-thumb--empty').first()
                                              .addClass('js-iup-thumb--add-link');
            $multifileinput.parents('form').trigger('reset');
        }.bind(this));
    }

    function iupSetupPreview() {
        var $preview_img = $(this.preview_container).find('img'),
            thumb_selector = '.' + this.classes.thumb;

        $(this.selectors.wrapper).find('.js-iup-thumb img').click(function() {
            var $img = $(this);
            if (!$img.attr('src')) {
                return;
            }
            $preview_img.attr('src', $img.data('preview-src')).show();

            $(thumb_selector + '.js-iup-thumb--selected').removeClass('js-iup-thumb--selected');
            $img.parents(thumb_selector).addClass('js-iup-thumb--selected');

        });
    }

    function iupAjaxUpload(options) {
        var config = {};
        config.ajax = this.actions.upload.config;

        if (options && typeof options === 'object') {
            $.extend(true, config, options);
        }

        // Evil!! Must be refactored
        config.ajax.xhr = config.ajax.xhr.bind(null, config.thumb_selector);
        config.ajax.target_thumb = config.thumb_selector;
        config.ajax.instance_container = this.selectors.container;
        // EOF Evil
        $(config.thumb_selector).addClass('js-iup-thumb--uploading');

        var jq_xhr = $.ajax(config.ajax)
        .done(this.actions.upload.handlers.done)
        .fail(this.actions.upload.handlers.fail)
        .always(this.actions.upload.handlers.always);

        var $cancel_upload_link = $(config.thumb_selector).find('.js-iup-thumb__cancel-upload');
        $cancel_upload_link.off('click').click(iupCancelUpload.bind(this, jq_xhr));
    }

    function iupCancelUpload(jq_xhr, e) {
        e.preventDefault();
        var $thumb = $(e.target).parents(this.selectors.thumb),
            index = $(this.selectors.thumbs_container).children().index($thumb);

        if(jq_xhr && jq_xhr.readyState != 4){
            jq_xhr.abort();
            console.log('Upload cancelled!');
            this.items.splice(index, 1);
            $thumb.remove();
            this.addItem({});
        }
    }

    function iupAjaxUploadCustomXhr(thumb_selector) {
        var xhr = new window.XMLHttpRequest();
        xhr.upload.addEventListener('progress', function(evt) {
            if (evt.lengthComputable) {
                var percent_complete = evt.loaded / evt.total;
                $(thumb_selector).find('progress').val(percent_complete*100);
            }
        }, false);

        return xhr;
    }

    function iupAjaxUploadDoneHandler(response) {
        console.log('done');
        var $thumb_container = $(this.target_thumb),
            $img = $thumb_container.find('img'),
            instance = iup(this.instance_container);

        $thumb_container.find('progress').hide();
        $thumb_container.removeClass('js-iup-thumb--uploading')
                        .addClass('js-iup-thumb--ready')
                        .attr('data-image-id', response.id);

        $img.data('preview-src', response.preview_src);
        $img.attr('src', response.src).show();

        var index = $thumb_container.parent().children().index($thumb_container);
        instance.items[index] = response;

        // Remove click handler, since it needs to use the current jq_xhr each time
        $(instance.selectors.thumb).eq(index).find('.js-iup-thumb__cancel-upload').off('click');
    }

    function iupAjaxUploadFailHandler(xhr, textStatus, errorThrown) {
        console.log('error');
        var $thumb = $(this.target_thumb),
            ajax_config = this,
            iup_instance = iup(ajax_config.instance_container),
            msg = 'Failed! ' + xhr.status + ': ' + xhr.statusText;

        $thumb.removeClass('js-iup-thumb--uploading')
              .addClass('js-iup-thumb--error')
              .find('.js-iup-thumb__message').html(msg).attr('title', msg);

        iupSetupRetryUpload($thumb, ajax_config, iup_instance);
        iupSetupRemoveFailedUpload($thumb, iup_instance);
    }

    function iupSetupRetryUpload($thumb, ajax_config, iup_instance) {
        var $retry_link = $thumb.find('.js-iup-thumb__retry');

        $retry_link.off('click').click(function(e) {
            e.preventDefault();
            $thumb.removeClass('js-iup-thumb--error')
            .addClass('js-iup-thumb--uploading');

            var jq_xhr = $.ajax(ajax_config)
                          .done(iup_instance.actions.upload.handlers.done)
                          .fail(iup_instance.actions.upload.handlers.fail)
                          .always(iup_instance.actions.upload.handlers.always),
                $cancel_upload_link = $thumb.find('.js-iup-thumb__cancel-upload');

            $cancel_upload_link.off('click').click(iupCancelUpload.bind(iup_instance, jq_xhr));
        });
    }

    function iupSetupRemoveFailedUpload($thumb, iup_instance) {
        var $remove_link = $thumb.find('.js-iup-thumb__remove-locally');
        $remove_link.off('click').click(function(e) {
            e.preventDefault();
            var index = $thumb.siblings().andSelf().index($thumb);
            iup_instance.removeItemLocally(index);
        });
    }

    function iupAjaxUploadAlwaysHandler() {
        console.log('done');
    }

    function dataAttrToObject(data_name, value, separator) {
        if (!separator) {
            separator = '.';
        }

        var obj = {},
            keys = data_name.split(separator);

        keys.reduce(function(prev_value, key, index) {
            if (index === keys.length-1) {
                return prev_value[key] = value;
            }

            return prev_value[key] = {};
        }, obj);
        return obj;
    }
})();
