#!/bin/bash
# Optimize images for web - Convert large images to WebP and resize
# This script optimizes images for faster loading

echo "=== Image Optimization Script ==="
echo ""

# Count images
TOTAL=$(find wp-content/uploads -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | wc -l | tr -d ' ')
echo "Found $TOTAL images to process"

# Get initial size
INITIAL_SIZE=$(du -sh wp-content/uploads | cut -f1)
echo "Initial size: $INITIAL_SIZE"
echo ""

# Process large images (>500KB) - resize to max 1920px width
echo "Processing large images (>500KB)..."
PROCESSED=0

find wp-content/uploads -type f \( -name "*.jpg" -o -name "*.jpeg" \) -size +500k | while read img; do
    # Get current width
    WIDTH=$(sips -g pixelWidth "$img" 2>/dev/null | tail -1 | awk '{print $2}')

    if [ "$WIDTH" -gt 1920 ] 2>/dev/null; then
        echo "  Resizing: $(basename "$img") ($WIDTH px -> 1920px)"
        sips --resampleWidth 1920 "$img" >/dev/null 2>&1
    fi

    # Compress with quality 80
    sips -s formatOptions 80 "$img" >/dev/null 2>&1
    PROCESSED=$((PROCESSED + 1))
done

# Process PNG files - convert to optimized PNG
echo ""
echo "Optimizing PNG files..."
find wp-content/uploads -type f -name "*.png" -size +100k | while read img; do
    # Use sips to recompress
    sips -s format png "$img" >/dev/null 2>&1
done

# Get final size
FINAL_SIZE=$(du -sh wp-content/uploads | cut -f1)

echo ""
echo "=== Optimization Complete ==="
echo "Before: $INITIAL_SIZE"
echo "After:  $FINAL_SIZE"
echo ""
echo "Note: For even better results, consider converting to WebP format."
echo "Run: find wp-content/uploads -name '*.jpg' -exec cwebp -q 80 {} -o {}.webp \;"
