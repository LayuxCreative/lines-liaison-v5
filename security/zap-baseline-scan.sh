#!/bin/bash

# OWASP ZAP Baseline Security Scan Script
# This script performs a baseline security scan on the staging URL

# Configuration
TARGET_URL="http://localhost:5174"  # Staging URL
REPORT_DIR="./security/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$REPORT_DIR/zap_baseline_report_$TIMESTAMP.html"
JSON_REPORT="$REPORT_DIR/zap_baseline_report_$TIMESTAMP.json"

# Create reports directory if it doesn't exist
mkdir -p "$REPORT_DIR"

echo "🔍 Starting OWASP ZAP Baseline Security Scan..."
echo "Target URL: $TARGET_URL"
echo "Report will be saved to: $REPORT_FILE"

# Run ZAP baseline scan using Docker
# The baseline scan is a quick scan that identifies potential vulnerabilities
docker run -v $(pwd)/security/reports:/zap/wrk/:rw \
    -t zaproxy/zap-stable zap-baseline.py \
    -t "$TARGET_URL" \
    -g gen.conf \
    -r "zap_baseline_report_$TIMESTAMP.html" \
    -J "zap_baseline_report_$TIMESTAMP.json" \
    -a

echo "✅ Scan completed!"
echo "📊 Reports generated:"
echo "  - HTML Report: $REPORT_FILE"
echo "  - JSON Report: $JSON_REPORT"

# Display summary
if [ -f "$JSON_REPORT" ]; then
    echo ""
    echo "📋 Quick Summary:"
    echo "Check the HTML report for detailed findings and recommendations."
fi