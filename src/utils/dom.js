/**
 * DOM Utilities
 * Helper functions for DOM manipulation
 */

/**
 * Safely queries a DOM element
 * @param {string} selector - CSS selector
 * @param {Element} [parent=document] - Parent element to search in
 * @returns {Element|null}
 */
export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Safely queries all matching DOM elements
 * @param {string} selector - CSS selector
 * @param {Element} [parent=document] - Parent element to search in
 * @returns {NodeListOf<Element>}
 */
export function $$(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

/**
 * Creates an element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} [attrs={}] - Attributes to set
 * @param {Array<Node|string>} [children=[]] - Child nodes or text
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, value);
        } else if (key === 'dataset') {
            Object.assign(el.dataset, value);
        } else {
            el.setAttribute(key, value);
        }
    }

    for (const child of children) {
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            el.appendChild(child);
        }
    }

    return el;
}

/**
 * Removes all children from an element
 * @param {Element} el - The element to clear
 */
export function clearElement(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

/**
 * Shows an element
 * @param {Element} el - The element to show
 */
export function show(el) {
    if (el) el.classList.remove('hidden');
}

/**
 * Hides an element
 * @param {Element} el - The element to hide
 */
export function hide(el) {
    if (el) el.classList.add('hidden');
}

/**
 * Toggles element visibility
 * @param {Element} el - The element to toggle
 * @param {boolean} [force] - Force show/hide
 */
export function toggle(el, force) {
    if (el) el.classList.toggle('hidden', force !== undefined ? !force : undefined);
}

/**
 * Adds event listener with automatic cleanup
 * @param {Element} el - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} [options] - Event listener options
 * @returns {Function} Cleanup function
 */
export function on(el, event, handler, options) {
    el.addEventListener(event, handler, options);
    return () => el.removeEventListener(event, handler, options);
}

/**
 * Delegates event handling to child elements
 * @param {Element} parent - Parent element
 * @param {string} event - Event name
 * @param {string} selector - CSS selector for children
 * @param {Function} handler - Event handler (receives event and matched element)
 * @returns {Function} Cleanup function
 */
export function delegate(parent, event, selector, handler) {
    const delegatedHandler = (e) => {
        const target = e.target.closest(selector);
        if (target && parent.contains(target)) {
            handler(e, target);
        }
    };
    parent.addEventListener(event, delegatedHandler);
    return () => parent.removeEventListener(event, delegatedHandler);
}
