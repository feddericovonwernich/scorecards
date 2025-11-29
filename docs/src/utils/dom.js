/**
 * DOM Utilities
 * Helper functions for DOM manipulation
 */

/**
 * Create an element with attributes and children
 * @param {string} tag - Element tag name
 * @param {Object} attrs - Element attributes
 * @param {Array|string|HTMLElement} children - Children elements or text
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);

    // Set attributes
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.substring(2).toLowerCase(), value);
        } else if (key === 'dataset' && typeof value === 'object') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else {
            element.setAttribute(key, value);
        }
    });

    // Add children
    const childArray = Array.isArray(children) ? children : [children];
    childArray.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof HTMLElement) {
            element.appendChild(child);
        }
    });

    return element;
}

/**
 * Show an element
 * @param {HTMLElement|string} element - Element or selector
 */
export function show(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.style.display = '';
}

/**
 * Hide an element
 * @param {HTMLElement|string} element - Element or selector
 */
export function hide(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.style.display = 'none';
}

/**
 * Toggle element visibility
 * @param {HTMLElement|string} element - Element or selector
 */
export function toggle(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
        el.style.display = el.style.display === 'none' ? '' : 'none';
    }
}

/**
 * Add event listener with delegation
 * @param {HTMLElement} parent - Parent element
 * @param {string} selector - Child selector
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 */
export function delegateEvent(parent, selector, event, handler) {
    parent.addEventListener(event, (e) => {
        const target = e.target.closest(selector);
        if (target) {
            handler.call(target, e);
        }
    });
}

/**
 * Add or remove a class from an element
 * @param {HTMLElement|string} element - Element or selector
 * @param {string} className - Class name
 * @param {boolean} add - True to add, false to remove
 */
export function toggleClass(element, className, add) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
        if (add) {
            el.classList.add(className);
        } else {
            el.classList.remove(className);
        }
    }
}

/**
 * Set innerHTML safely (for trusted content only)
 * @param {HTMLElement|string} element - Element or selector
 * @param {string} html - HTML content
 */
export function setHTML(element, html) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
        el.innerHTML = html;
    }
}
