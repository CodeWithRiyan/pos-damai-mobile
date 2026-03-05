# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# NativeWind
-keep class nativewind.** { *; }
-keep class com.nativewind.** { *; }

# expo-modules-kotlin (required for expo-file-system R8 release build)
-keep class expo.modules.kotlin.** { *; }
-keep interface expo.modules.kotlin.** { *; }
