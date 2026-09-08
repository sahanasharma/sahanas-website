# Sahana's portfolio

A dependency-free, multi-page portfolio with local cross-page search, a pastel notebook design, certificate previews and an interactive Solivia research write-up.

## Open the website

Extract the ZIP, then open `index.html` inside the `sahana-portfolio` folder in a modern browser. Keep the HTML pages and the `assets` folder together. The site does not require a package manager, build step or external JavaScript service.

For a local web-server preview, open a terminal in the `sahana-portfolio` folder and run:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`. Search also uses local JavaScript files, rather than a network API. External profile links and the Wharton issuer-hosted credential require an internet connection.

To publish, upload the **contents of this folder**, including every HTML page and the complete `assets` directory, to the root of the existing static website. Replacing only `index.html` is not enough. This package has not been published to a live domain.

## Pages and navigation

The top navigation uses this order on every page:

1. About: `index.html`
2. Research: `research.html`
3. Projects: `projects.html`
4. Co-curriculars: `co-curriculars.html`
5. Experience: `experience.html`
6. Education: `education.html`
7. Skills: `skills.html`

The additional `passion-project.html` page is linked from About, Research, Projects, relevant learning cards and search. It contains the Solivia Commercial Decision Support System write-up, quantitative specification, synthetic scenario lab, forecast-error illustration and complete 20-step roadmap.

## Edit and rebuild search

Edit the HTML pages directly. A searchable card or section has a unique `id`, a `data-index-title`, a `data-index-category` and optional `data-index-keywords`.

After changing searchable content, run:

```sh
python3 tools/rebuild_search.py
```

This standard-library Python tool rebuilds `assets/js/search-index.js` from all eight pages. It includes text inside collapsed disclosure elements. It does not change the pages or regenerate the PDF. Add new page filenames to the `PAGES` list when extending the site, and maintain the common navigation on each page.

Search supports keyboard shortcuts, multi-word matching, related terms, conservative typo tolerance and result highlighting. Selecting a result opens the relevant page and section. Deep links also expand a containing disclosure or reset a learning filter when needed.

## Main assets

- `assets/css/site.css`: shared responsive styling, print rules and reduced-motion support.
- `assets/js/app.js`: navigation, local search, certificate previews, learning filters and motion controls.
- `assets/js/project.js`: quotation arithmetic, input validation, synthetic forecast visualisation and roadmap controls.
- `assets/certificates/`: all 10 original supplied certificate/evidence files, unchanged.
- `assets/previews/`: optimised certificate thumbnails for the gallery.
- `assets/documents/solivia-technical-case-study.pdf`: printable project write-up with the full expanded roadmap.
- `tools/roadmap.json`: structured version of the source roadmap for reference. Changing it does not automatically change the HTML.

## Content and evidence

The supplied passion-project plan defines the project scope, the three phases and all 20 roadmap steps. The total estimate of 98 to 157 hours is the sum of the plan's ranges, not a record of time already spent.

Equations, data-audit measures, an illustrative procurement formulation and constructed numerical examples extend that plan. They are labelled as proposed methodology or synthetic demonstrations, not measured Solivia findings. The public calculator is a simplified educational example, not a production quotation, clinical tool, demand predictor or completed procurement optimiser. No actual company database or patient data is included.

Course applications are intended uses, not claims that each programme has been completed. Completed or participation evidence is grouped with the associated certificate rather than repeated in a separate programme table. The Girls Who Code Intro to Data Science completion certificate remains distinct from the summer programme whose supplied status was Accepted. Suggested method references are not presented as books already read.

Original certificate documents and the signed Wharton credential JSON are deliberately unmodified. Source certificates may contain their own typography. Authored website text, code comments and the new project PDF do not contain em-dash punctuation.

The PDF is a static snapshot of the web write-up. After updating the research page, expand the roadmap and other disclosure elements before using the browser's Print / Save as PDF function to produce an updated document. Verify the resulting pagination before replacing the existing PDF.

See `VERIFICATION.md` for the checks performed and their environment limitation.
