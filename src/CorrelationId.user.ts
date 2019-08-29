// ==UserScript==
// @name         Jarvis Drillthrough
// @namespace    https://github.com/daveparslow
// @version      1.0
// @description  Adds a drillthrough for Correlation Ids
// @author       Dave Parslow
// @match        https://jarvis-west.dc.ad.msft.net/*
// @run-at      document-idle
// @grant       GM.addSt
// @updateURL    https://raw.githubusercontent.com/daveparslow/jarvis-scripts/master/src/CorrelationId-userscript.js
// @downloadURL  https://raw.githubusercontent.com/daveparslow/jarvis-scripts/master/src/CorrelationId-userscript.js
// ==/UserScript==

(function() {
    var index: number;
    function setup() {
        var mutationObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                const target = mutation.target;
                if (!(target instanceof HTMLElement)) {
                    return;

                }
                if (mutation.type === 'childList' && target.className === 'pod') {
                    var rows = target.querySelectorAll('.row');
                    rows.forEach((row) => {

                        var cells = row.querySelectorAll('.cell');
                        var cell = cells[index];
                        if (cell && cell.children.length === 0) {
                            const value= cell.innerHTML;
                            let timeRange;
                            let timeInput = (document.querySelector('.timePicker input[type=text]') as HTMLInputElement).value;
                            try {
                                timeRange = (new Date(timeInput)).toISOString();
                            } catch (e) {
                                console.error('Invalid time', timeInput);
                            }

                            var ep = document.querySelector('div[data-bind="widget: endpointPicker"] .select2-choice span');
                            var np = document.querySelector('div[data-bind="widget: namespacePicker"] .select2-choice span');

                            var url = new URL(location.href);
                            url.pathname = 'logs/dgrep';
                            url.search = '';
                            url.searchParams.set('page', 'logs');
                            url.searchParams.set('be', 'DGrep');
                            url.searchParams.set('time', timeRange || '');
                            url.searchParams.set('offset', '-1');
                            url.searchParams.set('offsetUnit', 'Hours');
                            url.searchParams.set('UTC', 'false');
                            url.searchParams.set('ep', ep && ep.textContent || '');
                            url.searchParams.set('ns', np && np.textContent || '');
                            url.searchParams.set('en', 'IfxDiagnosticsEvent');
                            url.searchParams.set('scopingConditions', JSON.stringify([]));
                            url.searchParams.set('conditions', JSON.stringify([["Action_InternalCorrelationId","==", value]]));
                            url.searchParams.set('clientQuery', 'where Log_Level == "Error"');
                            url.searchParams.set('chartEditorVisible', 'true');
                            url.searchParams.set('chartType', 'Line');
                            url.searchParams.set('chartLayers', JSON.stringify([["New Layer",""]]));

                            // Use percent encoding
                            var href = url.pathname + '?' + Array.from(url.searchParams.entries()).map((entry => escape(entry[0])+'='+escape(entry[1]) )).join('&');

                            cell.innerHTML = `<a target="_blank" href='${href}'>` + cell.innerHTML + '</a>';
                        };
                    });
                }

                if (mutation.type === 'attributes' && mutation.attributeName === 'title' && target.title === 'Action_InternalCorrelationId') {
                    target.style.backgroundColor = 'yellow';
                    var headerContainer = target.closest('.row');
                    var headerCell = target.closest('.cell');
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
            characterDataOldValue: true
        });
    }

    if (document.readyState == "complete" || (document.readyState as string) == "loaded" || document.readyState == "interactive") {
        setup();
    } else {
        document.addEventListener(
            'DOMContentLoaded', setup, false
        );
    }
})();