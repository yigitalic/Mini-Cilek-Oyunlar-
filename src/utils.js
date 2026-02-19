export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => document.querySelectorAll(selector);

export function createElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.innerText = text;
    return el;
}

export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
