# ROOT — an entry for the Meshy × Chrona 3D World Contest

A grown-up child who left home at sixteen is trapped in the memory of the place they grew up: a red-brick apartment block in a drowned Dutch seaside town, 1980s, with a giant tree growing up through its courtyard. Each floor only lets you climb higher once you find what was lost; otherwise you keep walking the same hallway. The world moves from cold and colourless to warm and bright, until you reach the roof and push open a door standing on its own — home.

- **Deadline**: 2026-10-09 07:59 (Beijing time)
- **Platform**: [Chrona.world](https://chrona.world) — ZIP upload (index.html + assets), ≤ 200 MiB; published worlds are public
- **Play online**: https://khaoszen.github.io/ChronaMeshyProject/ (auto-deployed from `main`; add `?debug` for the debug HUD)
- **Design doc**: "ROOT 设计文档" in Claude Docs (gameplay, story, puzzle pool, asset list, concept-art prompts)
- **Tech**: Three.js + GLB models generated with the Meshy API

## Run locally

```bash
python3 -m http.server 8000
# http://localhost:8000/?debug   HUD with floor / puzzles / keys; 1–5 jump to a floor, K collects this floor's keys
```

## Package for Chrona

```bash
npm install
npm run pack        # → dist/root.zip (index.html + assets + a local copy of three, no CDN)
```

## Layout

```
index.html               the whole game (numbered sections: design data / platform adapter / level / floor looks / puzzles / audio / room & stairs / controls / interaction)
tools/pack.mjs           builds dist/root.zip
tools/meshy/             Meshy API batch generator + asset prompt list
docs/chrona-checklist.md open questions about the Chrona platform and the event interface
docs/assets.md           old asset conventions (the current list lives in the design doc)
```

## How it plays (graybox)

Every floor has the same layout: an L-shaped hallway → a small living room → stairs. The hallway runs around the inner courtyard: windows on the inner side look at the giant tree (from floor 3 its branches reach in through them), neighbours' doors line the outer side, and two corner windows face the sea. From each floor you see a different section of the tree, and a different number of storeys above you.

- **Finding the "keys"**: each key (a keepsake that brings back a memory) gets a random puzzle template and one of 8 spots that fit it. The screen never says how many there are.
- **The living room**: the door closes behind you. Each of this floor's keys has a faint outline where it belongs; walk up and press E to put it back. Opening the far door decides what happens, as an inner monologue:
  - all keys back: a story line, and the stairs lead up;
  - some missing: a hint line, and you are back at the start of this floor with the keys reset;
  - after a wrong interaction: a confused line;
  - still holding a key: the door won't open yet.
  - Each key has a note on the wall; the ones you haven't found are washed out, which hints at how many there are.
- **Seamless stairs**: the top of the exit stairs is a copy of the next floor's start. Halfway up you are moved to the same spot on the entry stairs; both views match pixel for pixel, so the switch is invisible. Light and colour blend into the next floor over a few seconds.
- **Cold → warm**: floor 1 is dark blue-grey; each floor up is warmer and more saturated.
- **Story in the space**: keys only appear where they make sense; family photos with blurred faces, evacuation notices on neighbours' doors, MISSING flyers on floor 3, two pairs of slippers on floor 4; the world reacts when you pick a key up (a face comes back into the photos, a broadcast, a ferry horn, plants grow); the living room gains furniture floor by floor; a distant broadcast on floor 2, someone humming on floor 4.
- **Twin puzzle**: the real one is the one that matches the mother's habits (the lamp still on, a face missing from the photo, the radio still playing…), and the wall notes say exactly that.
- **Floor 1 start**: the stairwell is closed by a door until you first reach the living room; the floor number sits to the front-right of the spawn.
- **Roof**: the floor-4 stairs lead straight onto the roof, the tree rises out of the courtyard, the sea is all around. A lone front door stands ajar with white light in the gap, a cracked empty flower pot beside it; walk through and the screen fades to white with your time and number of puzzles.

**On a phone or tablet**: turn it sideways. Drag on the left half to walk (push the stick all the way to walk faster), drag on the right half to look around, and tap USE when something can be picked up or opened. Add `?touch` to the URL to try the touch controls on a desktop.

**Two players (optional)**: on the start screen, the player can invite someone to join as **the mother**. They get a 4-letter room code; the second player opens the same world, picks "Join as the mother" and enters it. The mother sees every lost keepsake on the floor — even the hidden ones — but can't pick them up; looking at one and pressing E lights a warm beam over it for the child. The child sees her as a glowing, translucent figure. Playing alone works exactly the same. (Chrona's sandbox blocks WebSockets, so the two browsers connect peer-to-peer over WebRTC, with the handshake relayed through ntfy.sh over HTTPS.)

| Template | Status |
|---|---|
| Misplaced, Twin, Behind you, Lights out, Follow the sound, Combine | ✅ |
| Doors: three neighbours' doors are locked; one is left ajar with the key in the closet behind it | ✅ |
| Order: four drawings (seed → tree) or photos (baby → empty pier), shuffled; touch them in story order | ✅ |
| Window: a lit window in a distant building; the telescope shows the key there, then it is on your windowsill | ✅ |

Doors, Order and Window appear at most once per floor. Templates per floor: 1 — Misplaced; 2 — Misplaced, Twin, Behind you, Lights out; 3 — Twin, Behind you, Lights out, Follow the sound, Doors, Combine, Window; 4 — Follow the sound, Doors, Combine, Order, Window.

## Progress

- [x] Day 1 prototype, Chrona ZIP packaging, Meshy pipeline (test chair)
- [x] Redesign: gameplay, story "The Empty Flower Pot", puzzle pool, asset list, concept-art prompts
- [x] Graybox: four floors + roof, 9 puzzle templates, monologue lines, seamless stairs (pixel-verified), wall notes, end screen
- [x] Living room keepsakes put back by hand; courtyard layout; rooftop home door and flower pot
- [x] Setting moved to a 1980s Dutch apartment block; all in-game text in English
- [x] Concept art locked: hallway (floor 1, two states), roof, key props, furniture
- [x] Meshy assets: key props, furniture, pendant lamps, tree, rooftop door, distant drowned town, mother and child (29 models, ~4 MB total)
- [x] Photo / drawing textures (GPT image)
- [x] Optional two-player mode: the second player is the mother
- [x] Brick / plaster hallways that peel less floor by floor, Meshy living-room furniture, branches through the windows
- [x] Roof: low-poly animated sea with foam, gradient sky, drifting clouds, a ring of half-drowned buildings, lighthouse, sunken ferry, dyke, floating debris, seagulls
- [x] Mobile: landscape only, left thumb stick, right thumb look, USE button; lower pixel ratio and lighter scenery on phones
- [x] Model review pass: shoe cabinet, bookshelf, dining table, flower pot, tree trunk / crown, coat rack and clouds regenerated; floor roots, plants, ivy, flowers and window branches are Meshy models now
- [x] Doors swing open and shut; soft environment lighting; brighter floor 1; keys sit on the clear part of a furniture top
- [ ] Sound, polish, performance (batching, texture compression)
- [ ] Chrona upload by Oct 6 (Chrona records the demo video after upload; the X post must be live before Oct 8 23:59 UTC)

## Next

1. Oct 5: sound and polish, a full playthrough on a real GPU and a real phone, two-player test across two networks.
2. Upload to Chrona by Oct 6, then post on X with the demo video.
