# Verification notes

## Structure and content

All eight HTML pages have one main heading, unique element IDs, the same seven-link navigation order and a local shared search index. Local asset paths, page links and fragment destinations were checked. The package includes all 11 ongoing programme cards, nine grouped certificate cards, the separate accepted summer-programme entry, all 10 unchanged original evidence files and all 20 roadmap steps.

Original evidence files were compared by SHA-256 against the preceding supplied website ZIP. No original was changed. Authored HTML, CSS, JavaScript, Python, Markdown and the new PDF were scanned for em-dash punctuation. No occurrences were found.

## Browser rendering and interactions

Every page was rendered at viewport widths of 320, 390, 768 and 1,440 pixels. No document-level horizontal overflow was found. Representative desktop and mobile views, certificate cards, modal previews, the search interface, the quantitative write-up and the calculator were visually reviewed.

Tests exercised global search from all eight pages, topic ranking, safe rendering of unusual queries, keyboard shortcuts, arrow-key selection, Escape, certificate preview, learning filters, mobile menu controls, reduced motion and roadmap expansion. Hash-navigation tests confirmed that a collapsed roadmap step opens and that a filtered-out certificate becomes visible. No JavaScript page errors were observed.

The preview browser's environment blocks direct HTTP and file-URL navigation. For visual and interaction testing, the same HTML, CSS, image assets and scripts were loaded through a self-contained preview document. Page-to-page destinations were validated as real files and IDs, not tested as a deployed public website. Production-domain, hosting and browser-specific behaviour should be checked after publication.

## Numerical checks

The default synthetic quotation gives an included cost of S$12,500, a minimum quoted unit price of S$16.67, contribution of S$4,170 and a quoted margin of approximately 25.01%. A higher freight input of S$600 produces a minimum quoted unit price of S$16.94.

The quotation formula was compared with independent Python Decimal arithmetic over 100 reproducible random scenarios, including checks that rounding does not fall below the target margin. An exact-cent case was checked separately. Invalid, missing, negative and fractional-quantity inputs were tested, together with the zero-cost boundary, an over-budget warning and reset behaviour.

Forecast-error calculations were checked against the six constructed observations shown on the page. The baseline MAE is 13.33 units. The illustrative candidate MAE is 5.17 units and RMSE is 5.52 units. These values validate the displayed arithmetic, not a real forecasting model.

The new 15-page project PDF was rendered and checked for pagination, legibility and missing content. It is included both as a website asset and as a separate downloadable deliverable.
