#!/bin/bash
# Re-apply our patches manually to main since main does not have them!
# The user's repo merged the wrong PR or reverted my branch!
git checkout -b jules-15059229291556712996-0343b1d0-v3
# Wait, let's look at `git log --oneline` again.
# d644749 Update index.html
# 988558a Update game.js
# 0eabd22 Add files via upload
# 1ced4d7 Delete kael_sheet.png
# 42ec553 Merge pull request #1 from jsupraiser-rgb/hero-selection-metroidvania-15059229291556712996
# The user literally merged PR #1, and then committed OVERWRITES on top of it from the github UI that effectively reverted all of it!
# I need to restore the state from 9c3e883 (my last commit in my branch) and merge it into a new PR.
