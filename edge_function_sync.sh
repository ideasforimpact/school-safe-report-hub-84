#!/bin/bash

# List Supabase functions, skip first 3 lines, extract the 4th column as function names
functions=$(npx supabase functions list | tail -n +4 | awk '{print $4}' | grep -v '^$')

# Download each function by name
for name in $functions; do
  echo "Downloading function: $name..."
  npx supabase functions download "$name"
done

echo "All functions Downloaded ✅"

# Deploy each function directory found under supabase/functions
# for dir in supabase/functions/*/ ; do
#   if [ -d "$dir" ]; then
#     dirname=$(basename "$dir")
#     echo "Deploying function: $dirname..."
#     npx supabase functions deploy "$dirname"
#   fi
# done
