// Converse.js (A browser based XMPP chat client)
// http://conversejs.org
//
// Copyright (c) 2012-2017, Jan-Carel Brand <jc@opkode.com>
// Licensed under the Mozilla Public License (MPLv2)
//
/*global define */

/* This is a non-core Converse.js plugin which shows a list of currently open
 * rooms in the "Rooms Panel" of the ControlBox.
 */
(function (root, factory) {
    define(["utils",
            "converse-core",
            "converse-muc",
            "tpl!bookmark",
            "tpl!rooms_list"
        ], factory);
}(this, function (utils, converse, muc, tpl_bookmark, tpl_rooms_list) {
    var $ = converse.env.jQuery,
        Backbone = converse.env.Backbone,
        b64_sha1 = converse.env.b64_sha1,
        _ = converse.env._;

    converse.plugins.add('converse-roomslist', {
        initialize: function () {
            /* The initialize function gets called as soon as the plugin is
             * loaded by converse.js's plugin machinery.
             */
            var _converse = this._converse,
                __ = _converse.__,
                ___ = _converse.___;

            _converse.RoomsList = Backbone.Model.extend({
                defaults: {
                    "toggle-state":  _converse.OPENED
                },

                initialize: function () {
                }
            });

            _converse.RoomsListView = Backbone.View.extend({
                tagName: 'div',
                className: 'open-rooms-list, rooms-list-container',
                events: {
                    'click .close-room': 'closeRoom',
                    'click .open-rooms-toggle': 'toggleRoomsList'
                },

                initialize: function () {
                    this.model.on('add', this.renderRoomsListElement, this);
                    this.model.on('remove', this.removeRoomsListElement, this);

                    var cachekey = 'converse.roomslist'+_converse.bare_jid;
                    this.list_model = new _converse.RoomsList();
                    this.list_model.id = cachekey;
                    this.list_model.browserStorage = new Backbone.BrowserStorage[_converse.storage](
                        b64_sha1(cachekey)
                    );
                    this.list_model.fetch();
                    this.render();
                },

                render: function () {
                    this.el.innerHTML =
                        tpl_rooms_list({
                        'toggle_state': this.list_model.get('toggle-state'),
                        'desc_rooms': __('Click to toggle the rooms list'),
                        'label_rooms': __('Open Rooms')
                    })
                    this.hide();
                    if (this.list_model.get('toggle-state') !== _converse.OPENED) {
                        this.$('.open-rooms-list').hide();
                    }
                    this.model.each(this.renderRoomsListElement.bind(this));
                    var controlboxview = _converse.chatboxviews.get('controlbox');

                    if (!_.isUndefined(controlboxview) &&
                            !document.body.contains(this.el)) {
                        var container = controlboxview.el.querySelector('#chatrooms');
                        if (!_.isNull(container)) {
                            container.insertBefore(this.el, container.firstChild);
                        }
                    }
                    return this.$el;
                },

                hide: function () {
                    this.el.classList.add('hidden');
                },

                show: function () {
                    this.el.classList.remove('hidden');
                },

                removeRoom: function (ev) {
                    ev.preventDefault();
                    var name = $(ev.target).data('roomName');
                    var jid = $(ev.target).data('roomJid');
                    if (confirm(__(___("Are you sure you want to leave the room \"%1$s\"?"), name))) {
                        // TODO
                        _.invokeMap(_converse.chatboxes.where({'jid': jid}), Backbone.Model.prototype.destroy);
                    }
                },

                renderRoomsListElement: function (item) {
                    if (item.get('type') !== 'chatroom') {
                        return;
                    }
                    var div = document.createElement('div');
                    div.innerHTML = tpl_bookmark({
                        'name': item.get('name'),
                        'jid': item.get('jid'),
                        'open_title': __('Click to open this room'),
                        'info_title': __('Show more information on this room'),
                        'info_remove': __('Remove this room')
                    });
                    this.el.querySelector('.open-rooms-list').appendChild(div.firstChild);
                    this.show();
                },

                removeRoomsListElement: function (item) {
                    this.$('[data-room-jid="'+item.get('jid')+'"]:first').parent().remove();
                    if (this.model.length === 0) {
                        this.$el.hide();
                    }
                },

                toggleRoomsList: function (ev) {
                    if (ev && ev.preventDefault) { ev.preventDefault(); }
                    var $el = $(ev.target);
                    if ($el.hasClass("icon-opened")) {
                        this.$('.open-rooms-list').slideUp('fast');
                        this.list_model.save({'toggle-state': _converse.CLOSED});
                        $el.removeClass("icon-opened").addClass("icon-closed");
                    } else {
                        $el.removeClass("icon-closed").addClass("icon-opened");
                        this.$('.open-rooms-list').slideDown('fast');
                        this.list_model.save({'toggle-state': _converse.OPENED});
                    }
                }
            });

            var initRoomsListView = function () {
                _converse.rooms_list_view = new _converse.RoomsListView(
                    {'model': _converse.chatboxes}
                );
            };
            _converse.on('roomsPanelRendered', initRoomsListView);

            var afterReconnection = function () {
                if (_.isUndefined(_converse.rooms_list_view)) {
                    initRoomsListView();
                } else {
                    _converse.rooms_list_view.render();
                }
            };
            _converse.on('reconnected', afterReconnection);
        }
    });
}));
