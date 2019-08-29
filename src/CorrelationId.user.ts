/* eslint-disable linebreak-style */
// ==UserScript==
// @name         Jarvis Drillthrough
// @namespace    https://github.com/daveparslow
// @version      1.0
// @description  Adds a drillthrough for Correlation Ids
// @author       Dave Parslow
// @match        https://jarvis-west.dc.ad.msft.net/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/daveparslow/jarvis-scripts/master/src/CorrelationId-userscript.js
// @downloadURL  https://raw.githubusercontent.com/daveparslow/jarvis-scripts/master/src/CorrelationId-userscript.js
// ==/UserScript==

let index: number;
function setup(): void {
  const mutationObserver = new MutationObserver((mutations): void => {
    mutations.forEach((mutation) => {
      const { target } = mutation;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (mutation.type === 'childList' && target.className === 'pod') {
        const rows = target.querySelectorAll('.row');
        rows.forEach((row) => {
          const cells = row.querySelectorAll('.cell');
          const cell = cells[index];
          if (cell && cell.children.length === 0) {
            const value = cell.innerHTML;
            let timeRange;
            const timeInput = (document.querySelector(
              '.timePicker input[type=text]',
            ) as HTMLInputElement).value;
            try {
              timeRange = new Date(timeInput).toISOString();
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error('Invalid time', timeInput);
            }

            const ep = document.querySelector(
              'div[data-bind="widget: endpointPicker"] .select2-choice span',
            );
            const np = document.querySelector(
              'div[data-bind="widget: namespacePicker"] .select2-choice span',
            );

            const url = new URL(window.location.href);
            url.pathname = 'logs/dgrep';
            url.search = '';
            url.searchParams.set('page', 'logs');
            url.searchParams.set('be', 'DGrep');
            url.searchParams.set('time', timeRange || '');
            url.searchParams.set('offset', '-1');
            url.searchParams.set('offsetUnit', 'Hours');
            url.searchParams.set('UTC', 'false');
            url.searchParams.set('ep', (ep && ep.textContent) || '');
            url.searchParams.set('ns', (np && np.textContent) || '');
            url.searchParams.set('en', 'IfxDiagnosticsEvent');
            url.searchParams.set('scopingConditions', JSON.stringify([]));
            url.searchParams.set(
              'conditions',
              JSON.stringify([['Action_InternalCorrelationId', '==', value]]),
            );
            url.searchParams.set('clientQuery', 'where Log_Level == "Error"');
            url.searchParams.set('chartEditorVisible', 'true');
            url.searchParams.set('chartType', 'Line');
            url.searchParams.set(
              'chartLayers',
              JSON.stringify([['New Layer', '']]),
            );

            // Use percent encoding
            const href = `${url.pathname}?${Array.from(
              url.searchParams.entries(),
            )
              .map((entry) => `${escape(entry[0])}=${escape(entry[1])}`)
              .join('&')}`;

            cell.innerHTML = `<a target="_blank" href='${href}'>${cell.innerHTML}</a>`;
          }
        });
      }

      if (
        mutation.type === 'attributes'
        && mutation.attributeName === 'title'
        && target.title === 'Action_InternalCorrelationId'
      ) {
        target.style.backgroundColor = 'yellow';
        const headerContainer = target.closest('.row');
        const headerCell = target.closest('.cell');
        if (headerContainer && headerCell) {
          index = Array.from(headerContainer.children).indexOf(headerCell);
        }
      }
    });
  });

  mutationObserver.observe(document.documentElement, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
    attributeOldValue: true,
    characterDataOldValue: true,
  });
}

if (
  document.readyState === 'complete'
  || (document.readyState as string) === 'loaded'
  || document.readyState === 'interactive'
) {
  setup();
} else {
  document.addEventListener('DOMContentLoaded', setup, false);
}
