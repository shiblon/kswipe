# KSwipe

A Chrome Extension for Dexterity-Challenged Readers

The KSwipe extension (so called because of my friend whose name starts with 'K'), turns off all touch and click targets on a Kindle reader screen and only accepts definite swipe gestures for page-turning.

It debounces such gestures with extreme prejudice, only allowing a single page turn no matter how long or large the swipe is, never allowing it to go backwards on the same gesture, and enforcing a long cool-down time between swipes.

This makes it possible to swipe with low accuracy and without removing the finger or hand from the screen when going back, but still allowing a normal, single page turn on the reader.

## Use

To use, install this Chrome extension in your browser, and tap the icon when on `read.amazon.com`. An overlay will appear indicating that it is enabaled, which prevents all actions except unidirectional single-page swipes.

If you need to interact with the page, disable it in the same way.

TODO: Options are currently bogus.
