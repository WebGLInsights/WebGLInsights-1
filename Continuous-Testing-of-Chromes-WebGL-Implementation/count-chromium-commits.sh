#!/bin/sh

if [ $# -ne 2 ] ; then
  echo Usage: count-chromium-commits.sh [start date] [end date]
  echo example: count-chromium-commits.sh \"OCT 1 2014\" \"OCT 31 2014\"
  echo Run this while cd\'d into either the Chromium or Blink workspaces.
  exit 1
fi

git shortlog -sne --since "$1" --until "$2" | \
   grep -v commit | grep -v roller | \
   awk '{sum += $1 ; num += 1} END { \
    printf "Total commits: %d\nUnique committers: %d\n", sum, num}'
