#!/bin/bash
# Copy generated grammar diagrams to the public directory

BRAIN="/Users/huynhngocphuc/.gemini/antigravity/brain/d888201b-86ef-45a0-a6fd-1feedcdf337b"
DEST="apps/web/public/images/grammar/a1"

cp "$BRAIN/a1_alphabet_rule_1774194387094.png" "$DEST/a1_alphabet_rule_v4.png"
cp "$BRAIN/a1_alphabet_mnemonic_1774194405640.png" "$DEST/a1_alphabet_mnemonic_v4.png"
cp "$BRAIN/a1_pronomen_table_1774194422421.png" "$DEST/a1_pronomen_table_v4.png"
cp "$BRAIN/a1_regelmaessig_rule_1774194465273.png" "$DEST/a1_regelmaessig_rule_v4.png"
cp "$BRAIN/a1_satzbau_rule_1774194482932.png" "$DEST/a1_satzbau_fragen_v4.png"
cp "$BRAIN/a1_pronomen_mnemonic_1774194498875.png" "$DEST/a1_pronomen_mnemonic_v4.png"

echo "✅ All 6 diagrams copied to $DEST/"
ls -la "$DEST/"*.png | wc -l
echo "Total PNG files in directory"
