This a music composition application, conceptualized while exploring the capabilities of Sonic Pi (a live coding music program written with Ruby for the uninitiated)

I built out the structure for three concurrent instruments that trigger midi hits according to time-value arrays and decided that it would be cool to have an application that builds these arrays to match each other based on rhythmic logic and/or genre.  I decided to begin work in Javascript, since it is the language I know best, and for added personal benefit took the oportunity to familiarize myself with Typescript (which I have since learned to greatly appreciate for debugging and ease of code navigating!)

This decision quickly made me realize that in the long run I would be best off reverse engineering some of the important functionalites of Sonic Pi, instead of jumping back and forth between languages, and after working through myriad puzzles and building a basic front-end I was amazed and relieved to discover that midi can be sent to a local DAW directly from a live url in the browser

Fast forward a few months and the algorithm for the core "groove" functionality is still a work in progress, but the concept has evolved into a web program that generates full song structures!

On initial load a random groove is assigned to the bass which combines and subdivides to generate complimentary chord and drum grooves, that are then passed through a string of functions assigning note values according to a matrix of relatively simple music theory concepts. This is all then repeated to create slight variations to be used as different parts of the song, ie. verse, chorus, and bridge.  Finally a bpm and overall length are randomly assigned within a range and the parts are distributed to fill the established time

This creates a tree in the redux store that can be completely replaced by either customizing initial values in a form, or altering parts that don't sound quite right bit by bit

More features and bug fixes are being consistently rolled out and I welcome all suggestions that could make this a more powerful utility

Happy composing!
