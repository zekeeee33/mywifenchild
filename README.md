# Forever, Us

A responsive, personal family scrapbook website made with plain HTML, CSS, and JavaScript. The photographs in `assets/` are the family photos supplied for this project; no generated or stock family photos are used.

## Open the site

Open `index.html` in a current browser. No build step, package installation, or server is required. An internet connection is only needed to load the optional Google Fonts; system serif and sans-serif fonts are used as fallbacks.

## Personalize it

Edit [`config.js`](./config.js) to change:

- `wifeName` and `sonName`
- `specialDate` (use `YYYY-MM-DD`; leave blank until you want the live day count)
- Message text, letters, and the closing note
- Timeline milestones and their dates
- Gallery captions, categories, and local image paths
- The hero image and optional `backgroundMusic` path

Replace or add photos in `assets/`, then update the matching paths and alt text in `config.js`. Timeline and gallery dates are intentionally marked as editable placeholders rather than guessed.

The music button is off by default and plays a soft, synthesized melody only after it is pressed. The expandable letters, gallery filters, keyboard-accessible photo lightbox, mobile navigation, day counter, and reduced-motion preference are handled in `script.js`.
