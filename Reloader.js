define(["jquery", "qlik", "text!./lib/css/reload.css"], function($, qlik, cssContent) {

    var app = qlik.currApp(this);
    var interval = 300;
    var isPartial = false;

    $('<style>').html(cssContent).appendTo('head');
    $('body').append('<div id="modal-dialog" style="display:none"><p id="modal-contents"></p><p><a id="modal-close" class="button-link">OK</a></p></div>');

    function centeringModal(element) {
	var w = $(window).width();
	var h = $(window).height();
	var cw = element.outerWidth(true);
	var ch = element.outerHeight(true);
	var pxleft = ((w - cw) / 2);
	var pxtop = ((h - ch) / 2);
	element.css({'left': pxleft + 'px', 'top': pxtop + 'px'});
    }

    var showDialog = function(contents) {
        $('body').append('<div id="modal-overlay"></div>');
        $('#modal-contents').html(contents);
        $('#modal-overlay').fadeIn('slow');
        centeringModal($('#modal-dialog'));
        $('#modal-dialog').fadeIn('slow');
        $('#modal-overlay,#modal-close').unbind().click(function() {
            $('#modal-dialog,#modal-overlay').fadeOut('slow', function() {
	        $('#modal-overlay').remove();
            });
        });
        console.log(contents);
    }

    var reload = function(manual) {
        app.doReload(0, isPartial, false).then(function(e) {
            if ($('#modal-overlay')[0]) return false;
            if (e.qReturn) {
                app.doSave();
                if (manual) {
                    showDialog('Manual reload succeeded. isPartial:' + isPartial);
                } else {
                    console.log('Successfully reloaded automatically. isPartial:'
                                + isPartial + ', interval:' + interval
                                + ', ' + new Date());
                }
            } else {
                showDialog('ERROR: Reload failed. isPartial:' + isPartial);
            }
        });
    }

    var dispatchReloader = function(timer, interval, isPartial) {
        clearInterval(timer);
        return setInterval(reload, interval * 1000);
    }

    var timer = dispatchReloader(null, interval, isPartial);

    return {
      	definition: {
	    type: "items",
	    component: "accordion",
	    items: {
		settings: {
		    uses: "settings",
		    items: {
			myNewHeader: {
            		    type: "items",
            		    label: "Reloader Settings",
			    items: {
				IsPartialProp: {
				    ref: "prop.isPartial",
				    label: "Partial reload?",
				    type: "boolean",
                                    options: [{
                                        value: true,
                                        label: "Partial"
                                    }, {
                                        value: false,
                                        label: "Whole"
                                    }],
				    defaultValue: false
				},
				IntervalProp: {
				    ref: "prop.interval",
				    label: "Interval(Sec, 0:Stop)",
				    type: "integer",
				    defaultValue: "300",
                                    min: "0"
				}
			    }
			}
		    }
		}
	    }
	},
        paint: function ($element, layout) {
            if ((layout.prop.isPartial !== undefined && layout.prop.isPartial !== isPartial)) {
                isPartial = layout.prop.isPartial;
            }
            if (layout.prop.interval !== undefined && layout.prop.interval !== interval) {
                interval = layout.prop.interval;
                if (interval < 1) {
                    clearInterval(timer);
                } else {
                    timer = dispatchReloader(timer, interval, isPartial);
                }
            }
            var html = html = '<button type="button" id="reloadButton"><img src="data:image/png;base64,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" alt="button" width="100%" title="Reload MANUALLY"/></button>';
            $element.html(html);
            $('#reloadButton').click(
                function(event) {
                    event.preventDefault();
                    reload(true);
                });
        }
    };
});
