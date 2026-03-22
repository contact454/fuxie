#!/bin/bash
echo "Waiting for Audio Factory to finish..."
while pgrep -f "batch_produce.py --scripts-dir data/scripts/Sprechen-Nachsprechen-Phase2" > /dev/null; do
  sleep 30
done
echo "Audio Factory finished! Copying to Fuxie public folder..."
mkdir -p apps/web/public/audio/speaking/a1
cp -r ../8-Audio-Factory/data/output/Sprechen-Nachsprechen-Phase2/* apps/web/public/audio/speaking/a1/
echo "Stopping TTS server..."
../8-Audio-Factory/stop_factory.sh
echo "Done!"
