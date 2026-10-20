# Chog Echo: submission kit

Copy what you need into the Chogathon submission form. Check the form for its exact fields and length limits, and replace the bracketed parts with your own links.

## One-line pitch

Your Chog does the talking: every trait on your NFT shapes how it writes, so no Chog means no echo.

## What it is

Chog Echo turns a Chog NFT into a writing voice. The app reads the Chog's on-chain traits and converts them into five personality scores: confidence, sarcasm, chaos, warmth and brevity. Those scores drive an AI model that writes posts, replies, short stories and image memes in that Chog's voice. Two Chogs can fight over the same topic in Echo Battle, then reply to each other.

## Why the NFT is essential (the gate question)

1. Ownership gates the real experience. A holder signs a free message (no gas, no transaction). The server then checks `ownerOf` on the Chog contract on every generation.
2. The traits are read by the server from the token's own metadata, never sent by the browser, so they cannot be faked.
3. The traits are the product. Remove them and there is no voice to build. Two different Chogs give two different writers.
4. The meme image is drawn on the holder's own Chog artwork.
5. Meme layouts unlock only when a Chog's traits are strong enough: Decree needs Confidence 8, Comic burst needs Chaos 8, Deadpan needs Sarcasm 7.

Sample characters exist so judges can try the engine without owning a Chog. They are clearly labeled "not Chog NFTs", are rate limited, and use the same engine. The holder path is the real product.

## Judge access instructions

Quick test, no wallet needed:
1. Open [your live link].
2. Pick any sample Chog in the gallery.
3. Type a topic and press Echo.
4. Try the Meme tab: edit the text and download the image.
5. Open Battle, pick two Chogs, type a topic, and press Start battle. Press "Let them reply" afterwards.

Holder test:
1. Connect a wallet that holds a Chog on [Monad testnet or mainnet, as configured].
2. Your own Chogs appear in the gallery with their real artwork and traits.
3. Press Echo. Your wallet asks for one free signature. No gas is spent.

## Honest answers to check

1. Ask "is today Wednesday" on any day that is not Wednesday. The Chog should say no and name the real day, in its own voice.
2. Ask about the price of a token or today's news. The Chog should say it cannot know, instead of making something up.

## How it maps to the judging criteria

1. Novelty: NFT traits become a measurable writing personality, and the Voice DNA panel shows exactly how each trait moves each score.
2. Fun: Echo Battle with a live clash scene, Chog-to-Chog replies, trait-unlocked meme layouts.
3. Retention: memes and Voice DNA cards are made to be shared. Local feed today. A shared feed, likes and online battles are the planned next step and are not shipped yet.
4. Clarity: one-line idea on the home page, a "How it works" section, a visible trait-to-voice breakdown.
5. Execution: wallet connect on Monad, real ownership checks, streaming replies, image export, tested on desktop and mobile sizes.

## AI use disclosure

1. A language model through Groq writes the text. The prompt is built from the Chog's traits, the current date in the visitor's time zone, and rules against inventing facts.
2. Memes are drawn in the browser on the Chog's artwork. No image generation model is used.
3. The code was built with AI assistance (vibecoding).

## Demo video script (about 2.5 minutes)

1. 0:00 The idea in one sentence on the home page.
2. 0:15 Pick two different Chogs. Show how their Voice DNA differs and hover a trait to see which scores it changes.
3. 0:45 Echo the same topic with each and read the two voices.
4. 1:15 Make a meme, switch layouts, show the locked layout, download the image.
5. 1:45 Battle: start, watch the clash, vote, press "Let them reply".
6. 2:15 Connect a holder wallet and show the signature check, then say why removing the NFT breaks the product.

## Known limits

1. The feed and battles are stored in the visitor's browser. Shared and online versions need a database.
2. Rate limits are kept in server memory, which is fine for a demo.
3. The sample Chog images are crops from public collection pages. Replace them with official artwork before the final submission.
