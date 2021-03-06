/**
 * Debugger Bar
 *
 * This file is part of the Nette Framework (http://nette.org)
 * Copyright (c) 2004 David Grudl (http://davidgrudl.com)
 */

(function(){

	var $ = Nette.Query.factory;

	var Panel = Nette.DebugPanel = function(id) {
		this.id = 'nette-debug-panel-' + id;
		this.elem = $('#' + this.id);
	};

	Panel.PEEK = 'nette-mode-peek';
	Panel.FLOAT = 'nette-mode-float';
	Panel.WINDOW = 'nette-mode-window';
	Panel.FOCUSED = 'nette-focused';
	Panel.zIndex = 20000;

	Panel.prototype.init = function() {
		var _this = this;

		this.elem.data().onmove = function(coords) {
			_this.moveConstrains(this, coords);
		};

		this.elem.draggable({
			rightEdge: true,
			bottomEdge: true,
			handle: this.elem.find('h1'),
			stop: function() {
				_this.toFloat();
			}

		}).bind('mouseenter', function(e) {
			_this.focus();

		}).bind('mouseleave', function(e) {
			_this.blur();
		});

		this.elem.find('.nette-icons').find('a').bind('click', function(e) {
			if (this.rel === 'close') {
				_this.toPeek();
			} else {
				_this.toWindow();
			}
			e.preventDefault();
		});

		this.restorePosition();
	};

	Panel.prototype.is = function(mode) {
		return this.elem.hasClass(mode);
	};

	Panel.prototype.focus = function() {
		var elem = this.elem;
		if (this.is(Panel.WINDOW)) {
			elem.data().win.focus();
		} else {
			clearTimeout(elem.data().blurTimeout);
			elem.addClass(Panel.FOCUSED).show();
			elem[0].style.zIndex = Panel.zIndex++;
		}
	};

	Panel.prototype.blur = function() {
		var elem = this.elem;
		elem.removeClass(Panel.FOCUSED);
		if (this.is(Panel.PEEK)) {
			elem.data().blurTimeout = setTimeout(function() {
				elem.hide();
			}, 50);
		}
	};

	Panel.prototype.toFloat = function() {
		this.elem.removeClass(Panel.WINDOW).
			removeClass(Panel.PEEK).
			addClass(Panel.FLOAT).
			show();
		this.reposition();
	};

	Panel.prototype.toPeek = function() {
		this.elem.removeClass(Panel.WINDOW).
			removeClass(Panel.FLOAT).
			addClass(Panel.PEEK).
			hide();
		document.cookie = this.id + '=; path=/'; // delete position
	};

	Panel.prototype.toWindow = function() {
		var offset = this.elem.offset();
		offset.left += typeof window.screenLeft === 'number' ? window.screenLeft : (window.screenX + 10);
		offset.top += typeof window.screenTop === 'number' ? window.screenTop : (window.screenY + 50);

		var win = window.open('', this.id.replace(/-/g, '_'), 'left='+offset.left+',top='+offset.top+',width='+offset.width+',height='+(offset.height+15)+',resizable=yes,scrollbars=yes');
		if (!win) {
			return;
		}

		var doc = win.document;
		doc.write('<!DOCTYPE html><meta http-equiv="Content-Type" content="text\/html; charset=utf-8"><style>' + $('#nette-debug-style').dom().innerHTML + '<\/style><script>' + $('#nette-debug-script').dom().innerHTML + '<\/script><body id="nette-debug">');
		doc.body.innerHTML = '<div class="nette-panel nette-mode-window" id="' + this.id + '">' + this.elem.dom().innerHTML + '<\/div>';
		var winPanel = win.Nette.Debug.getPanel(this.id);
		win.Nette.Debug.initToggle();
		winPanel.reposition();
		doc.title = this.elem.find('h1').dom().innerHTML;

		var _this = this;
		$([win]).bind('unload', function() {
			_this.toPeek();
			win.close(); // forces closing, can be invoked by F5
		});

		$(doc).bind('keyup', function(e) {
			if (e.keyCode === 27 && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
				win.close();
			}
		});

		document.cookie = this.id + '=window; path=/'; // save position
		this.elem.hide().
			removeClass(Panel.FLOAT).
			removeClass(Panel.PEEK).
			addClass(Panel.WINDOW).
			data().win = win;
	};

	Panel.prototype.reposition = function() {
		if (this.is(Panel.WINDOW)) {
			var dE = document.documentElement;
			window.resizeBy(dE.scrollWidth - dE.clientWidth, dE.scrollHeight - dE.clientHeight);
		} else {
			var pos = this.elem.position();
			if (pos.width) { // is visible?
				this.elem.position({right: pos.right, bottom: pos.bottom});
				document.cookie = this.id + '=' + pos.right + ':' + pos.bottom + '; path=/';
			}
		}
	};

	Panel.prototype.moveConstrains = function(el, coords) { // forces constrained inside window
		var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
			height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
		coords.right = Math.min(Math.max(coords.right, -.2 * el.offsetWidth), width - .8 * el.offsetWidth);
		coords.bottom = Math.min(Math.max(coords.bottom, -.2 * el.offsetHeight), height - el.offsetHeight);
	};

	Panel.prototype.restorePosition = function() {
		var m = document.cookie.match(new RegExp(this.id + '=(window|(-?[0-9]+):(-?[0-9]+))'));
		if (m && m[2]) {
			this.elem.position({right: m[2], bottom: m[3]});
			this.toFloat();
		} else if (m) {
			this.toWindow();
		} else {
			this.elem.addClass(Panel.PEEK);
		}
	};



	var Bar = Nette.DebugBar = function() {
	};

	Bar.prototype.id = 'nette-debug-bar',

	Bar.prototype.init = function() {
		var elem = $('#' + this.id), _this = this;

		elem.data().onmove = function(coords) {
			_this.moveConstrains(this, coords);
		};

		elem.draggable({
			rightEdge: true,
			bottomEdge: true,
			draggedClass: 'nette-dragged',
			stop: function() {
				_this.savePosition();
			}
		});

		elem.find('a').bind('click', function(e) {
			if (this.rel === 'close') {
				_this.close();

			} else if (this.rel) {
				var panel = Debug.getPanel(this.rel);
				if (e.shiftKey) {
					panel.toFloat();
					panel.toWindow();

				} else if (panel.is(Panel.FLOAT)) {
					panel.toPeek();

				} else {
					panel.toFloat();
					panel.elem.position({
						right: panel.elem.position().right + Math.round(Math.random() * 100) + 20,
						bottom: panel.elem.position().bottom + Math.round(Math.random() * 100) + 20
					});
				}
			}
			e.preventDefault();

		}).bind('mouseenter', function(e) {
			if (this.rel && this.rel !== 'close' && !elem.hasClass('nette-dragged')) {
				var panel = Debug.getPanel(this.rel), link = $(this);
				panel.focus();
				if (panel.is(Panel.PEEK)) {
					panel.elem.position({
						right: panel.elem.position().right - link.offset().left + panel.elem.position().width - link.position().width - 4 + panel.elem.offset().left,
						bottom: panel.elem.position().bottom - elem.offset().top + panel.elem.position().height + 4 + panel.elem.offset().top
					});
				}
			}

		}).bind('mouseleave', function(e) {
			if (this.rel && this.rel !== 'close' && !elem.hasClass('nette-dragged')) {
				Debug.getPanel(this.rel).blur();
			}
		});

		this.restorePosition();
	};

	Bar.prototype.close = function() {
		$('#nette-debug').hide();
		if (window.opera) {
			$('body').show();
		}
	};

	Bar.prototype.moveConstrains = function(el, coords) { // forces constrained inside window
		var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
			height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
		coords.right = Math.min(Math.max(coords.right, 0), width - el.offsetWidth);
		coords.bottom = Math.min(Math.max(coords.bottom, 0), height - el.offsetHeight);
	};

	Bar.prototype.savePosition = function() {
		var pos = $('#' + this.id).position();
		document.cookie = this.id + '=' + pos.right + ':' + pos.bottom + '; path=/';
	};

	Bar.prototype.restorePosition = function() {
		var m = document.cookie.match(new RegExp(this.id + '=(-?[0-9]+):(-?[0-9]+)'));
		if (m) {
			$('#' + this.id).position({right: m[1], bottom: m[2]});
		}
	};



	var Debug = Nette.Debug = {};

	Debug.init = function() {
		Debug.initToggle();
		Debug.initResize();
		(new Bar).init();
		$('.nette-panel').each(function() {
			Debug.getPanel(this.id).init();
		});
	};

	Debug.getPanel = function(id) {
		return new Panel(id.replace('nette-debug-panel-', ''));
	};

	// enables <a class="nette-toggle" href="#"> or <span data-ref="#"> toggling
	Debug.initToggle = function() {
		$(document.body).bind('click', function(e) {
			for (var link = e.target; link && (!link.tagName || link.className.indexOf('nette-toggle') < 0); link = link.parentNode) {}
			if (!link) {
				return;
			}
			var collapsed = $(link).hasClass('nette-toggle-collapsed'),
				ref = link.getAttribute('data-ref') || link.getAttribute('href'),
				dest = ref && ref !== '#' ? $(ref) : $(link).next(''),
				panel = $(link).closest('.nette-panel'),
				oldPosition = panel.position();

			link.className = 'nette-toggle' + (collapsed ? '' : '-collapsed');
			dest[collapsed ? 'show' : 'hide']();
			e.preventDefault();

			var newPosition = panel.position();
			panel.position({
				right: newPosition.right - newPosition.width + oldPosition.width,
				bottom: newPosition.bottom - newPosition.height + oldPosition.height
			});
		});
	};

	Debug.initResize = function() {
		$(window).bind('resize', function() {
			var bar = $('#' + Bar.prototype.id);
			bar.position({right: bar.position().right, bottom: bar.position().bottom});
			$('.nette-panel').each(function() {
				Debug.getPanel(this.id).reposition();
			});
		});
	};

})();
