#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENV="${1:-dev}"

case "$ENV" in
  dev)
    API_URL="https://api-dev-pos-damai.riyansolusi.com"
    ENV_NAME="development"
    ;;
  sit)
    API_URL="https://api-sit-pos-damai.riyansolusi.com"
    ENV_NAME="sit"
    ;;
  demo)
    API_URL="https://api-demo-pos-damai.riyansolusi.com"
    ENV_NAME="demo"
    ;;
  prod)
    API_URL="https://api-pos-damai.riyansolusi.com"
    ENV_NAME="production"
    ;;
  *)
    echo -e "${RED}Invalid environment: $ENV${NC}"
    echo "Usage: ./build-apk.sh [dev|sit|demo|prod]"
    exit 1
    ;;
esac

echo -e "${GREEN}Building APK for: $ENV_NAME${NC}"
echo "API URL: $API_URL"

VERSION=$(node -p "require('./app.json').expo.version")
echo "Version: $VERSION"

export EXPO_PUBLIC_API_URL="$API_URL"

chmod +x android/gradlew

cd android
./gradlew assembleRelease
cd ..

APK_DIR="android/app/build/outputs/apk/release"
APK_NAME="pos-damai-v${VERSION}-${ENV}.apk"

# Find the universal APK (works on all architectures)
APK_SOURCE=$(find "$APK_DIR" -name "app-universal-release.apk" | head -n 1)

# Fallback to app-release.apk if universal not found
if [ -z "$APK_SOURCE" ]; then
  APK_SOURCE=$(find "$APK_DIR" -name "app-release.apk" | head -n 1)
fi

if [ -z "$APK_SOURCE" ]; then
  echo -e "${RED}No APK found in $APK_DIR${NC}"
  exit 1
fi

cp "$APK_SOURCE" "$APK_NAME"

echo -e "${GREEN}APK built successfully:${NC}"
ls -lh "$APK_NAME"
