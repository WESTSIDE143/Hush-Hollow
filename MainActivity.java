package com.pradipto.hushhollow;

import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;

/** Hush Hollow - a dreamcore experience. Created by Pradipto Chaudhury. */
public class MainActivity extends Activity {
    private static final String HOST = "hush.local";
    private WebView web;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 28) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setLoadWithOverviewMode(false);
        s.setUseWideViewPort(false);
        web.setLongClickable(false);
        web.setOnLongClickListener(new View.OnLongClickListener() {
            public boolean onLongClick(View v) { return true; }
        });
        web.setHapticFeedbackEnabled(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return serve(r);
            }
        });
        web.loadUrl("https://" + HOST + "/index.html");
        goImmersive();
    }

    private void goImmersive() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    public void onWindowFocusChanged(boolean f) {
        super.onWindowFocusChanged(f);
        if (f) goImmersive();
    }

    @Override
    protected void onPause() {
        super.onPause();
        try { web.evaluateJavascript("if(window.G&&G.setPause)G.setPause(true)", null); } catch (Exception e) { }
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        goImmersive();
    }

    @Override
    public void onBackPressed() {
        // Back = pause menu (never kills the game by accident)
        try { web.evaluateJavascript("if(window.G&&G.setPause)G.setPause(true)", null); } catch (Exception e) { }
    }

    @Override
    protected void onDestroy() {
        if (web != null) { web.destroy(); }
        super.onDestroy();
    }

    /* ---------- local files + one-time caching of the 3D engine and fonts ---------- */

    private WebResourceResponse serve(WebResourceRequest r) {
        String url = r.getUrl().toString();
        String host = r.getUrl().getHost();
        if (host == null) return null;
        try {
            if (HOST.equals(host)) {
                String p = r.getUrl().getPath();
                if (p == null || p.equals("/") || p.length() == 0) p = "/index.html";
                p = p.substring(1);
                if (p.contains("..")) return null;
                InputStream in = getAssets().open(p);
                return reply(mime(p), in, false);
            }
            if (host.equals("cdnjs.cloudflare.com") || host.equals("fonts.googleapis.com")
                    || host.equals("fonts.gstatic.com")) {
                return cached(url, r.getRequestHeaders());
            }
        } catch (IOException e) {
            return null;
        }
        return null;
    }

    private WebResourceResponse cached(String url, Map<String, String> reqHeaders) throws IOException {
        File dir = new File(getFilesDir(), "cache");
        if (!dir.exists()) dir.mkdirs();
        File f = new File(dir, md5(url));
        if (!f.exists() || f.length() == 0) {
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(15000);
            c.setReadTimeout(30000);
            if (reqHeaders != null && reqHeaders.get("User-Agent") != null)
                c.setRequestProperty("User-Agent", reqHeaders.get("User-Agent"));
            if (c.getResponseCode() != 200) return null;
            File tmp = new File(dir, f.getName() + ".tmp");
            InputStream in = c.getInputStream();
            FileOutputStream out = new FileOutputStream(tmp);
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            out.close();
            in.close();
            tmp.renameTo(f);
        }
        return reply(mime(url.split("\\?")[0]), new FileInputStream(f), true);
    }

    private WebResourceResponse reply(String mime, InputStream in, boolean cors) {
        String enc = mime.startsWith("text/") || mime.contains("javascript") || mime.contains("json") ? "utf-8" : null;
        WebResourceResponse res = new WebResourceResponse(mime, enc, in);
        Map<String, String> h = new HashMap<String, String>();
        h.put("Access-Control-Allow-Origin", "*");
        res.setResponseHeaders(h);
        return res;
    }

    private static String mime(String p) {
        p = p.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".css") || p.contains("googleapis.com/css")) return "text/css";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".woff")) return "font/woff";
        if (p.endsWith(".ttf")) return "font/ttf";
        if (p.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }

    private static String md5(String s) {
        try {
            byte[] d = MessageDigest.getInstance("MD5").digest(s.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte x : d) sb.append(String.format("%02x", x));
            return sb.toString();
        } catch (Exception e) { return Integer.toHexString(s.hashCode()); }
    }
}
