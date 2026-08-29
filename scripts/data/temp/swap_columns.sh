#!/bin/bash
# Usage: ./swap_columns.sh input.csv output.csv

input="$1"
output="$2"

awk -F',' 'NR==1 {print "czech,english"; next} {print $2 "," $1}' "$input" > "$output"