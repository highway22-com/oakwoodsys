/**
 * Oakwood Footer Builder - visual editor for the footer CMS JSON.
 *
 * Reads the initial JSON, renders editable Gutenberg-like sections, and keeps
 * the underlying JSON source field (ACF `page_content` or the
 * `oakwood_cms_content` meta box) in sync on every change.
 */
(function () {
	'use strict';

	var CFG = window.OAKWOOD_FOOTER_EDITOR || {};
	var T = CFG.i18n || {};

	var SOLUTION_GROUPS = [
		{ key: 'ai', label: 'AI' },
		{ key: 'dataAndAnalytics', label: 'Data & Analytics' },
		{ key: 'cloud', label: 'Cloud' },
		{ key: 'modernWork', label: 'Modern Work' },
		{ key: 'security', label: 'Security' },
		{ key: 'applications', label: 'Applications' }
	];

	var LINK_FIELDS = [
		{ key: 'text', label: 'Text', type: 'text' },
		{ key: 'routerLink', label: 'Router Link', type: 'text' }
	];

	var SOCIAL_FIELDS = [
		{ key: 'name', label: 'Name', type: 'text' },
		{ key: 'link', label: 'Link', type: 'text' },
		{ key: 'icon', label: 'Icon', type: 'text' }
	];

	var POLICY_FIELDS = [
		{ key: 'text', label: 'Text', type: 'text' },
		{ key: 'link', label: 'Link', type: 'text' }
	];

	var SOLUTION_FIELDS = [
		{ key: 'name', label: 'Name', type: 'text' },
		{ key: 'slug', label: 'Slug', type: 'text' },
		{ key: 'link', label: 'Link', type: 'text' }
	];

	var LOGO_FIELDS = [
		{ key: 'text', label: 'Text', type: 'text' },
		{ key: 'icon', label: 'Icon', type: 'text' }
	];

	var root = null;
	var model = {};
	var collapsed = {};
	var rawVisible = false;
	var invalid = false;

	// ---------------------------------------------------------------------
	// Source field helpers (mirrors oakwood_cms_preview_script)
	// ---------------------------------------------------------------------

	function getJsonTextarea() {
		return (
			document.getElementById('oakwood_cms_content') ||
			document.querySelector('.oakwood-cms-json-source textarea') ||
			document.querySelector('textarea[name*="page_content"]')
		);
	}

	function getSourceWrapper() {
		var ta = getJsonTextarea();
		if (!ta) {
			return null;
		}
		return ta.closest('.postbox') || ta.closest('.acf-field') || ta.parentElement;
	}

	function sync() {
		model.type = 'footer';
		model.page = 'footer';
		var ta = getJsonTextarea();
		if (!ta) {
			return;
		}
		ta.value = JSON.stringify(model, null, 2);
		ta.dispatchEvent(new Event('input', { bubbles: true }));
		ta.dispatchEvent(new Event('change', { bubbles: true }));
	}

	// ---------------------------------------------------------------------
	// Model normalization
	// ---------------------------------------------------------------------

	function ensureModel() {
		if (!model || typeof model !== 'object') {
			model = {};
		}
		if (!model.type) {
			model.type = 'footer';
		}
		if (!model.page) {
			model.page = 'footer';
		}
		if (!model.logo || typeof model.logo !== 'object') {
			model.logo = { text: '', icon: '' };
		}
		if (!model.contact || typeof model.contact !== 'object') {
			model.contact = { heading: '', phone: { text: '', link: '' }, email: { text: '', link: '' } };
		}
		if (!model.contact.phone || typeof model.contact.phone !== 'object') {
			model.contact.phone = { text: '', link: '' };
		}
		if (!model.contact.email || typeof model.contact.email !== 'object') {
			model.contact.email = { text: '', link: '' };
		}
		if (!Array.isArray(model.socialMedia)) {
			model.socialMedia = [];
		}
		if (!model.links || typeof model.links !== 'object') {
			model.links = {};
		}
		['services', 'industries', 'resources', 'company'].forEach(function (k) {
			if (!Array.isArray(model.links[k])) {
				model.links[k] = [];
			}
		});
		if (!model.links.solutions || typeof model.links.solutions !== 'object') {
			model.links.solutions = {};
		}
		SOLUTION_GROUPS.forEach(function (g) {
			if (!Array.isArray(model.links.solutions[g.key])) {
				model.links.solutions[g.key] = [];
			}
		});
		if (!Array.isArray(model.policies)) {
			model.policies = [];
		}
		if (model.copyright == null) {
			model.copyright = '';
		}
	}

	// ---------------------------------------------------------------------
	// DOM builders
	// ---------------------------------------------------------------------

	function el(tag, className, text) {
		var node = document.createElement(tag);
		if (className) {
			node.className = className;
		}
		if (text != null) {
			node.textContent = text;
		}
		return node;
	}

	function iconBtn(symbol, title, onClick, modifier, disabled) {
		var btn = el('button', 'ome-iconbtn' + (modifier ? ' ' + modifier : ''), symbol);
		btn.type = 'button';
		btn.title = title || '';
		if (disabled) {
			btn.disabled = true;
		}
		btn.addEventListener('click', function (e) {
			e.preventDefault();
			onClick();
		});
		return btn;
	}

	function renderAndSync() {
		render();
		sync();
	}

	function move(list, idx, delta) {
		var ni = idx + delta;
		if (ni < 0 || ni >= list.length) {
			return;
		}
		var tmp = list[idx];
		list[idx] = list[ni];
		list[ni] = tmp;
	}

	function createFieldOn(item, field) {
		var wrap = el('label', 'ome-field ome-field--' + field.type);
		var labelSpan = el('span', 'ome-field__label', field.label);
		var input;

		if (field.type === 'textarea') {
			input = el('textarea', 'ome-input');
			input.rows = 2;
			input.value = item[field.key] != null ? item[field.key] : '';
		} else if (field.type === 'checkbox') {
			input = document.createElement('input');
			input.type = 'checkbox';
			input.className = 'ome-input';
			input.checked = !!item[field.key];
		} else {
			input = document.createElement('input');
			input.type = field.type === 'number' ? 'number' : 'text';
			input.className = 'ome-input';
			input.value = item[field.key] != null ? item[field.key] : '';
		}

		function update() {
			if (field.type === 'checkbox') {
				item[field.key] = input.checked;
			} else if (field.type === 'number') {
				item[field.key] = input.value === '' ? '' : Number(input.value);
			} else {
				item[field.key] = input.value;
			}
			sync();
		}

		input.addEventListener('input', update);
		input.addEventListener('change', update);

		if (field.type === 'checkbox') {
			wrap.appendChild(input);
			wrap.appendChild(labelSpan);
		} else {
			wrap.appendChild(labelSpan);
			wrap.appendChild(input);
		}
		return wrap;
	}

	function createCard(list, idx, fields) {
		var item = list[idx];
		var card = el('div', 'ome-card');

		var head = el('div', 'ome-card__head');
		var titleText = item.name || item.text || item.label || (T.item || 'Item') + ' ' + (idx + 1);
		head.appendChild(el('span', 'ome-card__title', titleText));

		var tools = el('div', 'ome-card__tools');
		tools.appendChild(iconBtn('\u2191', T.moveUp || 'Move up', function () {
			move(list, idx, -1);
			renderAndSync();
		}, null, idx === 0));
		tools.appendChild(iconBtn('\u2193', T.moveDown || 'Move down', function () {
			move(list, idx, 1);
			renderAndSync();
		}, null, idx === list.length - 1));
		tools.appendChild(iconBtn('\u2715', T.remove || 'Remove', function () {
			list.splice(idx, 1);
			renderAndSync();
		}, 'ome-iconbtn--danger'));
		head.appendChild(tools);
		card.appendChild(head);

		var body = el('div', 'ome-card__body');
		fields.forEach(function (f) {
			body.appendChild(createFieldOn(item, f));
		});
		card.appendChild(body);

		return card;
	}

	function createStaticCard(title, fields, getItem) {
		var card = el('div', 'ome-card');
		var head = el('div', 'ome-card__head');
		head.appendChild(el('span', 'ome-card__title', title));
		card.appendChild(head);
		var body = el('div', 'ome-card__body');
		fields.forEach(function (f) {
			body.appendChild(createFieldOn(getItem(), f));
		});
		card.appendChild(body);
		return card;
	}

	function addBtn(label, onClick) {
		var btn = el('button', 'button button-secondary ome-add', '+ ' + label);
		btn.type = 'button';
		btn.addEventListener('click', function (e) {
			e.preventDefault();
			onClick();
		});
		return btn;
	}

	function renderCardList(container, list, fields, addLabel, factory) {
		var grid = el('div', 'ome-cards');
		list.forEach(function (_, idx) {
			grid.appendChild(createCard(list, idx, fields));
		});
		container.appendChild(grid);
		container.appendChild(addBtn(addLabel, function () {
			list.push(factory());
			renderAndSync();
		}));
	}

	function chevron() {
		return el('span', 'ome-panel__chevron', '\u25BC');
	}

	function makePanel(id, title, count) {
		var panel = el('section', 'ome-panel');
		if (collapsed[id]) {
			panel.classList.add('is-collapsed');
		}
		var header = el('button', 'ome-panel__header');
		header.type = 'button';
		header.appendChild(chevron());
		header.appendChild(el('span', 'ome-panel__title', title));
		header.appendChild(el('span', 'ome-panel__count', String(count)));
		header.addEventListener('click', function () {
			collapsed[id] = !collapsed[id];
			panel.classList.toggle('is-collapsed');
		});
		panel.appendChild(header);
		var body = el('div', 'ome-panel__body');
		panel.appendChild(body);
		return { panel: panel, body: body };
	}

	function makeSubPanel(id, title, count) {
		var panel = el('section', 'ome-subpanel');
		if (collapsed[id]) {
			panel.classList.add('is-collapsed');
		}
		var header = el('button', 'ome-subpanel__header');
		header.type = 'button';
		header.appendChild(chevron());
		header.appendChild(el('span', 'ome-panel__title', title));
		header.appendChild(el('span', 'ome-panel__count', String(count)));
		header.addEventListener('click', function () {
			collapsed[id] = !collapsed[id];
			panel.classList.toggle('is-collapsed');
		});
		panel.appendChild(header);
		var body = el('div', 'ome-subpanel__body');
		panel.appendChild(body);
		return { panel: panel, body: body };
	}

	// ---------------------------------------------------------------------
	// Sections
	// ---------------------------------------------------------------------

	function buildGeneralPanel() {
		var p = makePanel('general', T.general || 'General', 1);
		var grid = el('div', 'ome-cards');
		var card = el('div', 'ome-card');
		var body = el('div', 'ome-card__body');

		var typeField = el('label', 'ome-field');
		typeField.appendChild(el('span', 'ome-field__label', 'Type'));
		var typeInput = document.createElement('input');
		typeInput.type = 'text';
		typeInput.className = 'ome-input';
		typeInput.value = model.type || 'footer';
		typeInput.readOnly = true;
		typeField.appendChild(typeInput);
		body.appendChild(typeField);

		body.appendChild(createFieldOn(model, { key: 'copyright', label: 'Copyright', type: 'text' }));
		card.appendChild(body);
		grid.appendChild(card);
		p.body.appendChild(grid);
		return p.panel;
	}

	function buildLogoPanel() {
		var p = makePanel('logo', T.logo || 'Logo', 1);
		var grid = el('div', 'ome-cards');
		grid.appendChild(createStaticCard(T.logo || 'Logo', LOGO_FIELDS, function () {
			return model.logo;
		}));
		p.body.appendChild(grid);
		return p.panel;
	}

	function buildContactPanel() {
		var p = makePanel('contact', T.contact || 'Contact', 1);
		var grid = el('div', 'ome-cards');
		var card = el('div', 'ome-card');
		var body = el('div', 'ome-card__body');

		body.appendChild(createFieldOn(model.contact, { key: 'heading', label: 'Heading', type: 'text' }));
		body.appendChild(createFieldOn(model.contact.phone, { key: 'text', label: 'Phone Text', type: 'text' }));
		body.appendChild(createFieldOn(model.contact.phone, { key: 'link', label: 'Phone Link', type: 'text' }));
		body.appendChild(createFieldOn(model.contact.email, { key: 'text', label: 'Email Text', type: 'text' }));
		body.appendChild(createFieldOn(model.contact.email, { key: 'link', label: 'Email Link', type: 'text' }));

		card.appendChild(body);
		grid.appendChild(card);
		p.body.appendChild(grid);
		return p.panel;
	}

	function buildSimplePanel(id, title, list, fields) {
		var p = makePanel(id, title, list.length);
		renderCardList(p.body, list, fields, T.add || 'Add', function () {
			return {};
		});
		return p.panel;
	}

	function buildSolutionsPanel() {
		var total = 0;
		SOLUTION_GROUPS.forEach(function (g) {
			total += model.links.solutions[g.key].length;
		});
		var p = makePanel('solutions', T.solutions || 'Links: Solutions', total);
		SOLUTION_GROUPS.forEach(function (g) {
			var list = model.links.solutions[g.key];
			var sub = makeSubPanel('solutions:' + g.key, g.label, list.length);
			renderCardList(sub.body, list, SOLUTION_FIELDS, T.add || 'Add', function () {
				return {};
			});
			p.body.appendChild(sub.panel);
		});
		return p.panel;
	}

	function buildToolbar() {
		var bar = el('div', 'ome-toolbar');
		var toggle = el('button', 'button', rawVisible ? (T.rawHide || 'Hide raw JSON') : (T.rawShow || 'Edit raw JSON'));
		toggle.type = 'button';
		toggle.addEventListener('click', function (e) {
			e.preventDefault();
			rawVisible = !rawVisible;
			applyRawVisibility();
			toggle.textContent = rawVisible ? (T.rawHide || 'Hide raw JSON') : (T.rawShow || 'Edit raw JSON');
		});
		bar.appendChild(toggle);
		return bar;
	}

	function applyRawVisibility() {
		var wrap = getSourceWrapper();
		if (wrap) {
			wrap.style.display = rawVisible ? '' : 'none';
		}
	}

	// ---------------------------------------------------------------------
	// Render
	// ---------------------------------------------------------------------

	function render() {
		ensureModel();
		root.innerHTML = '';

		if (!getJsonTextarea()) {
			root.appendChild(el('div', 'ome-notice', T.noField || 'JSON source field not found on this screen.'));
			return;
		}

		root.appendChild(buildToolbar());

		if (invalid) {
			root.appendChild(el('div', 'ome-notice', T.invalidJson || 'The stored JSON is invalid.'));
		}

		root.appendChild(buildGeneralPanel());
		root.appendChild(buildLogoPanel());
		root.appendChild(buildContactPanel());
		root.appendChild(buildSimplePanel('social', T.socialMedia || 'Social Media', model.socialMedia, SOCIAL_FIELDS));
		root.appendChild(buildSimplePanel('links-services', T.services || 'Links: Services', model.links.services, LINK_FIELDS));
		root.appendChild(buildSimplePanel('links-industries', T.industries || 'Links: Industries', model.links.industries, LINK_FIELDS));
		root.appendChild(buildSimplePanel('links-resources', T.resources || 'Links: Resources', model.links.resources, LINK_FIELDS));
		root.appendChild(buildSimplePanel('links-company', T.company || 'Links: Company', model.links.company, LINK_FIELDS));
		root.appendChild(buildSolutionsPanel());
		root.appendChild(buildSimplePanel('policies', T.policies || 'Policies', model.policies, POLICY_FIELDS));
	}

	// ---------------------------------------------------------------------
	// Init
	// ---------------------------------------------------------------------

	function parseInitial() {
		var raw = typeof CFG.initial === 'string' ? CFG.initial.trim() : '';
		if (raw === '') {
			model = {};
			invalid = false;
			return;
		}
		try {
			var parsed = JSON.parse(raw);
			model = parsed && typeof parsed === 'object' ? parsed : {};
			invalid = false;
		} catch (err) {
			model = {};
			invalid = true;
		}
	}

	function init() {
		root = document.getElementById('oakwood-footer-editor');
		if (!root) {
			return;
		}
		parseInitial();
		ensureModel();
		render();
		applyRawVisibility();
		if (invalid) {
			rawVisible = true;
			applyRawVisibility();
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
