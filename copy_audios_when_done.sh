#!/bin/bash
set -euo pipefail

SOURCE_DIR="../8-Audio-Factory/data/output/Sprechen-Nachsprechen-Phase2"
TARGET_ROOT="apps/web/public/audio/speaking"

echo "Waiting for Audio Factory to finish..."
while pgrep -f "batch_produce.py --scripts-dir data/scripts/Sprechen-Nachsprechen-Phase2" > /dev/null; do
  sleep 30
done
echo "Audio Factory finished! Copying to Fuxie public folder..."

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Audio output directory not found: $SOURCE_DIR" >&2
  exit 1
fi

# Generated split audio files are gitignored/CDN inputs. Keep this copy merge-only:
# never clean TARGET_ROOT here, or tracked fallback audio files can disappear.
for d in "$SOURCE_DIR"/*; do
  if [ -d "$d" ]; then
    folder_name=$(basename "$d")
    cefr="${folder_name%%-*}"

    case "$cefr" in
      a1|a2|b1|b2|c1|c2) ;;
      *)
        echo "Skipping folder with unknown CEFR prefix: $folder_name" >&2
        continue
        ;;
    esac

    mkdir -p "$TARGET_ROOT/$cefr"
    cp -R "$d" "$TARGET_ROOT/$cefr/"
  fi
done

deleted_tracked=$(git ls-files -d -- "$TARGET_ROOT" || true)
if [ -n "$deleted_tracked" ]; then
  echo "Tracked audio files were deleted during copy. Restore or inspect before committing:" >&2
  echo "$deleted_tracked" >&2
  exit 1
fi

echo "Stopping TTS server..."
../8-Audio-Factory/stop_factory.sh
echo "Done!"
