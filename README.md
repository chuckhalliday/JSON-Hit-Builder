<h2>Welcome to the Node Composer GitHub repo!</h2>

This a music composition application you can find at node-composer.vercel.app, conceptualized while I was exploring the capabilities of Sonic Pi (a live coding music program written with Ruby for the uninitiated)

I had built out the structure for three concurrent instruments that trigger MIDI hits from enum strings according to time-value arrays, and decided that it would be cool to have an application that builds these arrays to match each other based on rhythmic logic and/or genre.  I decided to begin work in Javascript, since it is the language I know best, and for added personal benefit took the oportunity to familiarize myself with Typescript (which I have since learned to greatly appreciate for avoiding bugs and the ease of navigating the code!)

This decision quickly made me realize that in the long run I would be best off reverse-engineering some of the important functionalites of Sonic Pi, instead of jumping back and forth between languages, and after working through myriad puzzles and deploying a basic drum machine front-end I was amazed (and relieved) to discover that MIDI can be sent to a local DAW directly from a live URL in the browser

~Thus far I have only worked with MIDI on my Macbook and to replicate the full functionality you want to make sure that you have 3 buses set up on your IAC driver - Bus 1 for drums, Bus 2 for bass, and Bus 3 for chords

Fast forward a few months and the algorithm for the core "groove" functionality is still a work in progress, but the concept has expanded into a web program that generates complete song structures!

On initial load a random groove is assigned to the bass which combines and subdivides to generate complimentary chord and drum grooves, that are then passed through a string of functions assigning note values according to a matrix of tonal music theory concepts. This is all then repeated to create slight variations to be used as different parts of the song, ie. verse, chorus, and bridge.  Finally a bpm and overall length are randomly assigned within a range of 3-5 minutes and the parts are distributed to fill the established time

This creates a tree in the redux store that can be either completely replaced by customizing the desired initial values in a form, or altering parts note by note as you see fit in the rendered components

Of course, the true value in this (as I see it) is simply to provide a fleshed out canvas on which to overlay your sonic ideas, without having to overthink the minutae of setting up your tracks.  How great your personal art can be will always depend on the soul you can breath into it.  I only seek to build the best conduit possible to be prepared when inspiration strikes

More features and bug fixes are being consistently rolled out and I welcome all suggestions that could make this a more powerful utility in the instant ideation of tunes

Happy composing!