#!/bin/bash

# Script per scaricare i video generati da RunComfy
cd "$(dirname "$0")"

echo "📥 Scaricando video..."

curl -L -o stress-buster.mp4 "https://playgrounds-storage-public.runcomfy.net/eNozMzRNs7BMNNE1N0lL1DWxNEnTtUyyNNG1MEoysTAyTrU0TzEFAKZxCQk%3D/eNozMjAy1TU00jUwDzEwsDIytDIy0jM2NjSysNQG8g0MAGopBmo%3D/output/Z-5GuOkaNUyjqkeNU3-h6_output.mp4"
echo "✅ stress-buster.mp4"

curl -L -o box-breathing.mp4 "https://playgrounds-storage-public.runcomfy.net/eNozMzRNs7BMNNE1N0lL1DWxNEnTtUyyNNG1MEoysTAyTrU0TzEFAKZxCQk%3D/eNozMjAy1TU00jUwDzEwsDIytDI20jO0NLE0s9AG8g0MAGqoBnY%3D/output/H1BbfnRB0gjrxnYQxvnCB_output.mp4"
echo "✅ box-breathing.mp4"

curl -L -o box-breathing-geometric.mp4 "https://playgrounds-storage-public.runcomfy.net/eNozMzRNs7BMNNE1N0lL1DWxNEnTtUyyNNG1MEoysTAyTrU0TzEFAKZxCQk%3D/eNozMjAy1TU00jUwDzEwsDIytDI20bOwtDAyMdcG8g0MAGrqBnk%3D/output/EvnnTSaztBQp5uVNYeTxE_output.mp4"
echo "✅ box-breathing-geometric.mp4"

curl -L -o humming.mp4 "https://playgrounds-storage-public.runcomfy.net/eNozMzRNs7BMNNE1N0lL1DWxNEnTtUyyNNG1MEoysTAyTrU0TzEFAKZxCQk%3D/eNozMjAy1TU00jUwDzEwsDIytDIx0zM2MbEwNtMG8g0MAGqhBnI%3D/output/03SLeeoSgPAExhVOPJKIm_output.mp4"
echo "✅ humming.mp4"

curl -L -o cold-exposure.mp4 "https://playgrounds-storage-public.runcomfy.net/eNozMzRNs7BMNNE1N0lL1DWxNEnTtUyyNNG1MEoysTAyTrU0TzEFAKZxCQk%3D/eNozMjAy1TU00jUwDzEwsDIytDI11zM1sjAwNdYG8g0MAGqbBm8%3D/output/aeCrs4onyXlhZM8IwPJXP_output.mp4"
echo "✅ cold-exposure.mp4"

curl -L -o physiological-sigh.mp4 "https://playgrounds-storage-public.runcomfy.net/eNozMzRNs7BMNNE1N0lL1DWxNEnTtUyyNNG1MEoysTAyTrU0TzEFAKZxCQk%3D/eNozMjAy1TU00jUwDzEwsDIytDKx1DM2Mja3NNAG8g0MAGqoBnE%3D/output/l63YMOYy9tqStvh7MHUsx_output.mp4"
echo "✅ physiological-sigh.mp4"

curl -L -o 4-7-8-breathing.mp4 "https://playgrounds-storage-public.runcomfy.net/eNozMzRNs7BMNNE1N0lL1DWxNEnTtUyyNNG1MEoysTAyTrU0TzEFAKZxCQk%3D/eNozMjAy1TU00jUwDzEwsDIysjK21DMwNzY3NdQG8g0MAGqkBnA%3D/output/xGwxpDqbjDrvwRowlELpF_output.mp4"
echo "✅ 4-7-8-breathing.mp4"

echo ""
echo "🎉 Tutti i video scaricati!"
ls -lh *.mp4
