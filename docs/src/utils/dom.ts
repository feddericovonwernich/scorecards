/**
 * DOM Utilities
 * Helper functions for DOM manipulation
 */

export interface ElementAttributes {
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
  dataset?: Record<string, string>;
  [key: string]: unknown;
}

export type ElementChild = string | HTMLElement | null | undefined;

/**
 * Create an element with attributes and children
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: ElementAttributes = {},
  children: ElementChild | ElementChild[] = []
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  // Set attributes
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className' && typeof value === 'string') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object' && value !== null) {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(
        key.substring(2).toLowerCase(),
        value as EventListener
      );
    } else if (key === 'dataset' && typeof value === 'object' && value !== null) {
      Object.entries(value as Record<string, string>).forEach(
        ([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        }
      );
    } else if (typeof value === 'string' || typeof value === 'number') {
      element.setAttribute(key, String(value));
    }
  });

  // Add children
  const childArray = Array.isArray(children) ? children : [children];
  childArray.forEach((child) => {
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
 */
export function show(element: HTMLElement | string | null): void {
  const el =
    typeof element === 'string' ? document.querySelector<HTMLElement>(element) : element;
  if (el) {el.style.display = '';}
}

/**
 * Hide an element
 */
export function hide(element: HTMLElement | string | null): void {
  const el =
    typeof element === 'string' ? document.querySelector<HTMLElement>(element) : element;
  if (el) {el.style.display = 'none';}
}

/**
 * Toggle element visibility
 */
export function toggle(element: HTMLElement | string | null): void {
  const el =
    typeof element === 'string' ? document.querySelector<HTMLElement>(element) : element;
  if (el) {
    el.style.display = el.style.display === 'none' ? '' : 'none';
  }
}

/**
 * Add event listener with delegation
 */
export function delegateEvent(
  parent: HTMLElement,
  selector: string,
  event: string,
  handler: (this: HTMLElement, e: Event) => void
): void {
  parent.addEventListener(event, (e: Event) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>(selector);
    if (target) {
      handler.call(target, e);
    }
  });
}

/**
 * Add or remove a class from an element
 */
export function toggleClass(
  element: HTMLElement | string | null,
  className: string,
  add: boolean
): void {
  const el =
    typeof element === 'string' ? document.querySelector<HTMLElement>(element) : element;
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
 */
export function setHTML(element: HTMLElement | string | null, html: string): void {
  const el =
    typeof element === 'string' ? document.querySelector<HTMLElement>(element) : element;
  if (el) {
    el.innerHTML = html;
  }
}
