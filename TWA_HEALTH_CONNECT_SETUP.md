# TWA (Trusted Web Activity) + Health Connect Setup

## Overview

VitaConnect is a **PWA wrapped in a TWA** for Android.
The TWA acts as a native shell that:
1. Hosts the Next.js PWA full-screen (no browser chrome)
2. Injects the `HealthConnectAndroid` JavaScript bridge
3. Handles Health Connect permission dialogs natively

---

## 1. Android Project Setup

### build.gradle (app)
```gradle
android {
    compileSdk 34
    defaultConfig {
        applicationId "com.vitaconnect.app"
        minSdk 26            // Health Connect requires API 26+
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }
}

dependencies {
    // TWA
    implementation "com.google.androidbrowserhelper:androidbrowserhelper:2.5.0"

    // Health Connect
    implementation "androidx.health.connect:connect-client:1.1.0-alpha07"

    // Coroutines (for Health Connect suspend functions)
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3"
}
```

---

## 2. AndroidManifest.xml

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Health Connect permissions -->
    <uses-permission android:name="android.permission.health.READ_HEART_RATE" />
    <uses-permission android:name="android.permission.health.READ_STEPS" />
    <uses-permission android:name="android.permission.health.READ_BLOOD_PRESSURE" />
    <uses-permission android:name="android.permission.health.READ_BLOOD_GLUCOSE" />
    <uses-permission android:name="android.permission.health.READ_OXYGEN_SATURATION" />
    <uses-permission android:name="android.permission.health.READ_BODY_TEMPERATURE" />
    <uses-permission android:name="android.permission.health.READ_SLEEP" />
    <uses-permission android:name="android.permission.health.READ_WEIGHT" />
    <uses-permission android:name="android.permission.health.READ_ACTIVE_CALORIES_BURNED" />
    <uses-permission android:name="android.permission.health.READ_DISTANCE" />
    <uses-permission android:name="android.permission.health.READ_EXERCISE" />
    <uses-permission android:name="android.permission.health.READ_RESPIRATORY_RATE" />

    <application ...>

        <!-- TWA Activity -->
        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:exported="true">
            <meta-data
                android:name="android.support.customtabs.trusted.DEFAULT_URL"
                android:value="https://vitaconnect.health/dashboard" />
            <meta-data
                android:name="android.support.customtabs.trusted.STATUS_BAR_COLOR"
                android:resource="@color/colorPrimary" />
            <meta-data
                android:name="android.support.customtabs.trusted.DISPLAY_MODE"
                android:value="standalone" />
            <meta-data
                android:name="android.support.customtabs.trusted.SCREEN_ORIENTATION"
                android:value="portrait" />
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="vitaconnect.health" />
            </intent-filter>
        </activity>

        <!-- Health Connect permission rationale activity -->
        <activity-alias
            android:name="ViewPermissionUsageActivity"
            android:exported="true"
            android:targetActivity=".MainActivity"
            android:permission="android.permission.START_VIEW_PERMISSION_USAGE">
            <intent-filter>
                <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />
                <category android:name="android.intent.category.HEALTH_PERMISSIONS" />
            </intent-filter>
        </activity-alias>

    </application>
</manifest>
```

---

## 3. Health Connect JavaScript Bridge (Kotlin)

Create `HealthConnectBridge.kt`:

```kotlin
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant

class HealthConnectBridge(
    private val context: android.content.Context,
    private val webView: WebView,
    private val coroutineScope: CoroutineScope,
) {
    private val client: HealthConnectClient by lazy {
        HealthConnectClient.getOrCreate(context)
    }

    @JavascriptInterface
    fun checkAvailability(): String {
        return when (HealthConnectClient.getSdkStatus(context)) {
            HealthConnectClient.SDK_AVAILABLE -> "Available"
            HealthConnectClient.SDK_UNAVAILABLE -> "NotSupported"
            else -> "NotInstalled"
        }
    }

    @JavascriptInterface
    fun readHeartRate(startTimeIso: String, endTimeIso: String, callbackId: String) {
        coroutineScope.launch {
            try {
                val request = ReadRecordsRequest(
                    recordType = HeartRateRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(
                        Instant.parse(startTimeIso),
                        Instant.parse(endTimeIso)
                    )
                )
                val response = client.readRecords(request)
                val arr = JSONArray()
                response.records.forEach { record ->
                    record.samples.forEach { sample ->
                        arr.put(JSONObject().apply {
                            put("type", "HeartRate")
                            put("beatsPerMinute", sample.beatsPerMinute)
                            put("time", sample.time.toString())
                            put("metadata", JSONObject().apply {
                                put("id", record.metadata.id)
                                put("dataOrigin", record.metadata.dataOrigin.packageName)
                            })
                        })
                    }
                }
                dispatchCallback(callbackId, true, arr.toString())
            } catch (e: Exception) {
                dispatchCallback(callbackId, false, e.message ?: "Unknown error")
            }
        }
    }

    @JavascriptInterface
    fun readSteps(startTimeIso: String, endTimeIso: String, callbackId: String) {
        coroutineScope.launch {
            try {
                val request = ReadRecordsRequest(
                    recordType = StepsRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(
                        Instant.parse(startTimeIso),
                        Instant.parse(endTimeIso)
                    )
                )
                val response = client.readRecords(request)
                val arr = JSONArray()
                response.records.forEach { record ->
                    arr.put(JSONObject().apply {
                        put("type", "Steps")
                        put("count", record.count)
                        put("startTime", record.startTime.toString())
                        put("endTime", record.endTime.toString())
                        put("metadata", JSONObject().apply { put("id", record.metadata.id) })
                    })
                }
                dispatchCallback(callbackId, true, arr.toString())
            } catch (e: Exception) {
                dispatchCallback(callbackId, false, e.message ?: "Unknown error")
            }
        }
    }

    private fun dispatchCallback(callbackId: String, success: Boolean, data: String) {
        val escaped = data.replace("\\", "\\\\").replace("'", "\\'")
        webView.post {
            webView.evaluateJavascript(
                "window.__hcCallbacks['$callbackId'](${if (success) "null" else "'$escaped'"}, ${if (success) "'$escaped'" else "null"})",
                null
            )
        }
    }
}
```

---

## 4. Inject Bridge in WebView Activity

```kotlin
class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true

            // Inject Health Connect bridge
            addJavascriptInterface(
                HealthConnectBridge(this@MainActivity, this, scope),
                "HealthConnectAndroid"
            )

            loadUrl("https://vitaconnect.health/dashboard")
        }
        setContentView(webView)
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }
}
```

---

## 5. Digital Asset Links

Your Next.js app already serves `/.well-known/assetlinks.json`.
Replace the SHA-256 fingerprint with your actual release keystore fingerprint:

```bash
# Get fingerprint from your keystore
keytool -list -v -keystore release.keystore -alias vitaconnect -storepass yourpassword

# Or from Play Console:
# Release > Setup > App signing > App signing key certificate > SHA-256 fingerprint
```

---

## 6. Health Connect Permissions Rationale

Add a `health_permissions_rationale.xml` in `res/xml/`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<health-permissions>
    <uses-health-data type="HeartRate" />
    <uses-health-data type="Steps" />
    <uses-health-data type="BloodPressure" />
    <uses-health-data type="BloodGlucose" />
    <uses-health-data type="OxygenSaturation" />
    <uses-health-data type="BodyTemperature" />
    <uses-health-data type="SleepSession" />
    <uses-health-data type="Weight" />
    <uses-health-data type="ActiveCaloriesBurned" />
    <uses-health-data type="ExerciseSession" />
</health-permissions>
```

---

## 7. Testing Checklist

- [ ] Install Health Connect from Play Store on test device (API 26+)
- [ ] Add test data via Google Fit, Samsung Health, or the Health Connect test app
- [ ] Verify `window.HealthConnectAndroid` is injected in WebView
- [ ] Confirm Digital Asset Links pass: `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://vitaconnect.health&relation=delegate_permission/common.handle_all_urls`
- [ ] Test offline PWA caching
- [ ] Test permission grant/revoke flow
