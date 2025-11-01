package com.mehroz2762.hashdex

import android.content.Intent
import android.os.Build
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Set the theme to AppTheme BEFORE onCreate to support
        // coloring the background, status bar, and navigation bar.
        setTheme(R.style.AppTheme)
        super.onCreate(null)

        // Handle the initial share intent for react-native-share-menu v6.0.0
        handleShareIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Handle new share intents while the app is running
        handleShareIntent(intent)
    }

    private fun handleShareIntent(intent: Intent) {
        try {
            // For react-native-share-menu v6.0.0 - correct package structure
            val shareMenuModuleClass = Class.forName("com.reactnativesharemenu.ShareMenuModule")
            val setIntentMethod = shareMenuModuleClass.getMethod("setIntent", Intent::class.java)
            setIntentMethod.invoke(null, intent)
        } catch (e: Exception) {
            // If it fails, the module will handle it through its own mechanism
            // This is normal - the share menu should still work
            // Remove the fallback to com.meedan as it's not needed for v6.0.0
        }
    }

    override fun getMainComponentName(): String = "main"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
        )
    }

    override fun invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                super.invokeDefaultOnBackPressed()
            }
            return
        }
        super.invokeDefaultOnBackPressed()
    }
}